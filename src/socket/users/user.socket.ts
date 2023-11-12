import { OnModuleInit } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io'
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import * as CryptoJS from "crypto-js";
import axios from "axios";
import * as qs from "qs";
import * as moment from "moment";
import { User } from "./entities/user.entity";
import { JwtService } from "../jwt/jwt.service";
import { PayMode, Receipt, ReceiptStatus } from "../receipt/entities/receipt.entity";
import { ReceiptDetail } from "../receipt/entities/receipt-detail.entity";

interface ClientType {
    user: User,
    socket: Socket
}
@WebSocketGateway({ cors: true })
export class UserSocketGateway implements OnModuleInit {

    @WebSocketServer()
    server: Server
    clients: ClientType[] = [];

    constructor(
        private readonly jwt: JwtService,
        @InjectRepository(Receipt) private readonly receipts: Repository<Receipt>,
        @InjectRepository(ReceiptDetail) private readonly receiptDetail: Repository<ReceiptDetail>
    ) { }

    onModuleInit() {
        this.server.on("connect", async (socket: Socket) => {
            socket.emit("connectStatus", {
                message: "Đăng nhập thất bại",
                status: false
            })
            console.log("Đã có người connect")
            /* Xóa người dùng khỏi clients nếu disconnect */
            socket.on("disconnect", () => {
                console.log("có 1 user đã out!")
                this.clients = this.clients.filter(client => client.socket.id != socket.id)
            })

            /* Xác thực người dùng */
            let token: string = String(socket.handshake.query.token);
            let user = (this.jwt.verifyToken(token) as User);
            if (token == "undefined" || !user) {
                socket.emit("connectStatus", {
                    message: "Đăng nhập thất bại",
                    status: false
                })
                socket.disconnect();
            } else {

                this.clients.push({
                    socket,
                    user
                })

                socket.emit("connectStatus", {
                    message: "Đăng nhập thành công",
                    status: true
                })

                socket.emit("receiveUserData", user)

                let receipt = await this.findReceiptByAuthId({
                    userId: user.id,
                    guestId: null
                });

                socket.emit("receiveReceipt", receipt ? receipt : [])

                let cart = await this.getCartByUserId(user.id);
                if (cart) {
                    socket.emit("receiveCart", cart)
                }

                socket.on("addToCart", async (newItem: { receiptId: string, optionId: string, quantity: number }) => {
                    let cart = await this.addToCart(newItem)
                    if (cart) {
                        for (let i in this.clients) {
                            if (this.clients[i].user.id == user.id) {
                                this.clients[i].socket.emit("receiveCart", cart)
                            }
                        }
                    }
                })

                socket.on("payCash", async (data: {
                    receiptId: string,
                    userId: string
                }) => {
                    console.log("data", data)
                    let cashInfor = await this.cash(data.receiptId, data.userId)
                    if (cashInfor) {
                        for (let i in this.clients) {
                            if (this.clients[i].user.id == user.id) {
                                this.clients[i].socket.emit("receiveCart", cashInfor[0])
                                this.clients[i].socket.emit("receiveReceipt", cashInfor[1])
                            }
                        }
                    }
                })
                socket.on("deleteItemFromCart", async (newItem: { receiptId: string, optionId: string }) => {
                    let cart = await this.deleteItemFromCart(newItem);
                    if (cart) {
                        socket.emit("receiveCart", cart)
                    }
                })



                socket.on("payZalo", async (data: {
                    receiptId: string
                }) => {
                    let zaloCash = await this.zaloCash(data.receiptId, user, socket);
                    if (zaloCash) {
                        for (let i in this.clients) {
                            if (this.clients[i].user.id == user.id) {
                                this.clients[i].socket.emit("receiveCart", zaloCash[0])
                                this.clients[i].socket.emit("receiveReceipt", zaloCash[1])
                                this.clients[i].socket.emit("cash-status", true)
                            }
                        }
                    }
                })
            }
        })
    }

    async findReceiptByAuthId(data: {
        userId: string | null,
        guestId: string | null
    }) {
        try {
            if (data.userId == null && data.guestId == null) return false
            let receipts = await this.receipts.find({
                where: data.userId ? {
                    userId: data.userId,
                    status: Not(ReceiptStatus.SHOPPING)
                } : {
                    guestId: data.guestId,
                    status: Not(ReceiptStatus.SHOPPING)
                },
                relations: {
                    detail: {
                        option: {
                            product: true,
                            pictures: true
                        }
                    }
                }
            })

            if (!receipts) return false

            if (receipts.length == 0) return false

            return receipts
        } catch (err) {
            return false
        }
    }

    async getCartByUserId(userId: string) {
        try {
            let oldCart = await this.receipts.find({
                where: {
                    userId,
                    status: ReceiptStatus.SHOPPING
                },
                relations: {
                    detail: {
                        option: {
                            product: true,
                            pictures: true
                        }
                    }
                }
            })
            if (!oldCart || oldCart.length == 0) { // nếu tìm giỏ hàng cũ bị lỗi
                // tạo giỏ hàng
                let newCartChema = this.receipts.create({
                    userId,

                })
                let newCart = await this.receipts.save(newCartChema);

                if (!newCart) return false

                let newCartRelation = await this.receipts.findOne({
                    where: {
                        id: newCart.id,
                    },
                    relations: {
                        detail: {
                            option: {
                                product: true,
                                pictures: true
                            }
                        }
                    }
                })
                console.log("tới 2")
                if (!newCartRelation) return false
                return newCartRelation
            }
            return oldCart[0]
        } catch (err) {
            console.log("err", err)
            return false
        }
    }

    async addToCart(newItem: { receiptId: string, optionId: string, quantity: number }) {
        try {
            let items = await this.receiptDetail.find({
                where: {
                    receiptId: newItem.receiptId
                }
            })
            if (!items) return false
            if (items.length == 0) {
                await this.receiptDetail.save(newItem)
            } else {
                let check = items.find(item => item.optionId == newItem.optionId);
                if (check) {
                    let itemUpdate = this.receiptDetail.merge(items.find(item => item.optionId == newItem.optionId), {
                        quantity: newItem.quantity
                    })
                    await this.receiptDetail.save(itemUpdate)
                } else {
                    await this.receiptDetail.save(newItem)
                }
            }

            let cart = await this.receipts.findOne({
                where: {
                    id: newItem.receiptId
                },
                relations: {
                    detail: {
                        option: {
                            product: true,
                            pictures: true
                        }
                    }
                }
            })

            if (!cart) return false
            return cart
        } catch (err) {
            return false
        }
    }
    async deleteItemFromCart(newItem: { receiptId: string, optionId: string }) {
        try {

            // Xóa mục từ giỏ hàng
            await this.receiptDetail.delete({
                receiptId: newItem.receiptId,
                optionId: newItem.optionId
            });

            // Lấy lại thông tin giỏ hàng sau khi xóa
            let cart = await this.receipts.findOne({
                where: {
                    id: newItem.receiptId
                },
                relations: {
                    detail: {
                        option: {
                            product: true,
                            pictures: true
                        }
                    }
                }
            });

            if (!cart) return false;
            return cart;
        } catch (err) {
            return false;
        }
    }
    // async cash(receiptId: string, userId: string) {
    //     try {
    //         let nowCart = await this.receipts.findOne({
    //             where: {
    //                 id: receiptId
    //             }
    //         })
    //         if (!nowCart) return false
    //         let cartUpdate = this.receipts.merge(nowCart, {
    //             status: ReceiptStatus.PENDING
    //         })
    //         let cartResult = await this.receipts.save(cartUpdate);
    //         if (!cartResult) return false

    //         // Tạo Cart Mới
    //         let newCart = await this.getCartByUserId(userId);
    //         if (!newCart) return false

    //         let receipts = await this.receipts.find({
    //             where: {
    //                 userId,
    //                 status: Not(ReceiptStatus.SHOPPING)
    //             },
    //             relations: {
    //                 detail: {
    //                     option: {
    //                         product: true,
    //                         pictures: true
    //                     }
    //                 }
    //             }
    //         })
    //         if (!receipts) return false
    //         return [newCart, receipts]
    //     } catch (err) {
    //         return false
    //     }
    // }
    async cash(receiptId: string, userId: string, options: {
        payMode: PayMode,
        paid?: boolean,
        paidAt?: string,
        zaloTranId?: string
    } | null = null): Promise<[Receipt, Receipt[]] | null> {
        try {
            let nowCart = await this.receipts.findOne({
                where: {
                    id: receiptId
                },
                relations: {
                    detail: {
                        option: {
                            product: true,
                            pictures: true
                        }
                    }
                }
            })
            if (!nowCart) return null
            let cartUpdate = this.receipts.merge(nowCart, {
                status: ReceiptStatus.PENDING,
                total: nowCart.detail?.reduce((value, cur) => {
                    return value += cur.quantity * cur.option.price
                }, 0),
                ...options
            })
            let cartResult = await this.receipts.save(cartUpdate);
            if (!cartResult) return null

            // Tạo Cart Mới
            let newCart = await this.getCartByUserId(userId);
            if (!newCart) return null

            let receipts = await this.receipts.find({
                where: {
                    userId,
                    status: Not(ReceiptStatus.SHOPPING)
                },
                relations: {
                    detail: {
                        option: {
                            product: true,
                            pictures: true
                        }
                    }
                }
            })
            if (!receipts) return null

            return [newCart, receipts]
        } catch (err) {
            return null
        }
    }
    async zaloCash(receiptId: string, user: User, socket: Socket) {
        let finish: boolean = false;
        let result: [Receipt, Receipt[]] | null = null;
        /* Bước 1: Lấy dữ liệu dơn hàng và đăng ký giao dịch trên Zalo*/
        let nowCart = await this.receipts.findOne({
            where: {
                id: receiptId
            },
            relations: {
                detail: {
                    option: {
                        product: true,
                        pictures: true
                    }
                }
            }
        })
        if (!nowCart) return false

        let zaloRes = await this.zaloCreateReceipt(user, nowCart);

        if (!zaloRes) return false
        /* Bước 2: Gửi thông tin thanh toán về cho client*/
        socket.emit("payQr", zaloRes.payUrl)
        /* Bước 3: Kiểm tra thanh toán*/
        let payInterval: NodeJS.Timeout | null = null;

        /* Sau bao lâu thì hủy giao dịch! */
        setTimeout(() => {
            socket.emit("payQr", null)
            clearInterval(payInterval)
            finish = true;
        }, 1000 * 60 * 2)

        setInterval(async () => {
            let payStatus = await this.zaloCheckPaid(zaloRes.orderId)
            if (payStatus) {
                result = await this.cash(receiptId, user.id, {
                    paid: true,
                    paidAt: String(Date.now()),
                    payMode: PayMode.ZALO,
                    zaloTranId: zaloRes.orderId
                })
                finish = true;
                return
            }
        }, 1000)

        return new Promise((resolve, reject) => {
            setInterval(() => {
                if (finish) {
                    resolve(result)
                }
            }, 1000)
        })
    }

    async zaloCreateReceipt(user: User, receipt: Receipt) {
        let result: {
            payUrl: string;
            orderId: string;
        } | null = null;
        const config = {
            appid: process.env.ZALO_APPID,
            key1: process.env.ZALO_KEY1,
            key2: process.env.ZALO_KEY2,
            create: process.env.ZALO_CREATE_URL,
            confirm: process.env.ZALO_COFIRM_URL,
        };

        const orderInfo = {
            appid: config.appid,
            apptransid: `${moment().format('YYMMDD')}_${Date.now() * Math.random()}_${receipt.id}`,
            appuser: user.userName,
            apptime: Date.now(),
            item: JSON.stringify([]),
            embeddata: JSON.stringify({
                merchantinfo: "PS5 Store" // key require merchantinfo
            }),
            amount: Number(receipt.detail?.reduce((value, cur) => {
                return value += cur.quantity * cur.option.price
            }, 0)),
            description: "Thanh Toán Cho Shop PS5",
            bankcode: "zalopayapp",
            mac: ""
        };

        const data = config.appid + "|" + orderInfo.apptransid + "|" + orderInfo.appuser + "|" + orderInfo.amount + "|" + orderInfo.apptime + "|" + orderInfo.embeddata + "|" + orderInfo.item;
        orderInfo.mac = CryptoJS.HmacSHA256(data, String(config.key1)).toString();

        await axios.post(String(config.create), null, { params: orderInfo })
            .then(zaloRes => {
                if (zaloRes.data.returncode == 1) {
                    result = {
                        payUrl: zaloRes.data.orderurl,
                        orderId: orderInfo.apptransid
                    }
                }
            })
        return result
    }

    async zaloCheckPaid(zaloTransid: string) {
        const config = {
            appid: process.env.ZALO_APPID,
            key1: process.env.ZALO_KEY1,
            key2: process.env.ZALO_KEY2,
            create: process.env.ZALO_CREATE_URL,
            confirm: process.env.ZALO_COFIRM_URL,
        };

        let postData = {
            appid: config.appid,
            apptransid: zaloTransid,
            mac: ""
        }

        let data = config.appid + "|" + postData.apptransid + "|" + config.key1; // appid|apptransid|key1
        postData.mac = CryptoJS.HmacSHA256(data, String(config.key1)).toString();


        let postConfig = {
            method: 'post',
            url: String(config.confirm),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: String(qs.stringify(postData))
        };

        return await axios.post(postConfig.url, postConfig.data)
            .then(function (resZalo) {
                if (resZalo.data.returncode == 1) return true
                return false
            })
            .catch(function (error) {
                return false
            });
    }
}



