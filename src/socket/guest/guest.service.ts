import { Injectable } from "@nestjs/common";
import { GuestDto, ReceiptDetailDto } from "./dto/cash.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Guest } from "./entities/guest.entity";
import { Repository } from "typeorm";
import { PayMode, Receipt, ReceiptStatus } from "../receipt/entities/receipt.entity";
import { ReceiptDetail } from "../receipt/entities/receipt-detail.entity";


@Injectable()
export class GuestService {

    constructor(
        @InjectRepository(Guest) private readonly guestSer: Repository<Guest>,
        @InjectRepository(Receipt) private readonly receiptSer: Repository<Receipt>,
        @InjectRepository(ReceiptDetail) private readonly receiptDetail: Repository<ReceiptDetail>
    ) { }

    async create(receiptDetails: ReceiptDetailDto[], guest: GuestDto, payMode: string, total: number) {
        /* Tạo guest */
        try {
            const guestExisted = await this.guestSer.findOne({
                where: {
                    email: guest.email
                }
            })
            if (!guestExisted) {
                let newGuestSchema = this.guestSer.create(guest);
                let newGuest = await this.guestSer.save(newGuestSchema);
                if (newGuest) {
                    /* Tạo Receipt */
                    const receiptSchema = this.receiptSer.create({
                        payMode: payMode == "CASH" ? PayMode.CASH : PayMode.ZALO,
                        total: Number(total),
                        guestId: newGuest.id,
                        status: ReceiptStatus.PENDING
                    })
                    const newReceipt = await this.receiptSer.save(receiptSchema);
                    if (newReceipt) {
                        let receiptDetailFormat = receiptDetails.map((item) => {
                            return {
                                ...item,
                                receiptId: newReceipt.id
                            }
                        })

                        for (let i in receiptDetailFormat) {
                            await this.receiptDetail.save(receiptDetailFormat[i]);
                        }

                        return [true, "ok", null]
                    } else {
                        return [false, "failed", null]
                    }
                }
            } else {
                /* Tạo Receipt */
                const receiptSchema = this.receiptSer.create({
                    payMode: payMode == "CASH" ? PayMode.CASH : PayMode.ZALO,
                    total: Number(total),
                    guestId: guestExisted.id,
                    status: ReceiptStatus.PENDING
                })
                const newReceipt = await this.receiptSer.save(receiptSchema);
                if (newReceipt) {
                    let receiptDetailFormat = receiptDetails.map((item) => {
                        return {
                            ...item,
                            receiptId: newReceipt.id
                        }
                    })

                    for (let i in receiptDetailFormat) {
                        await this.receiptDetail.save(receiptDetailFormat[i]);
                    }

                    return [true, "ok", null]
                } else {
                    return [false, "failed", null]
                }
            }
        } catch (err) {
            return [false, "failed", null]
        }
    }

    async findReceipts(email: string) {
        try {
            let guest = await this.guestSer.findOne({
                where: {
                    email
                }
            })
            if(!guest) return [false, "Không tìm thấy khách hàng!", null]
            let receipts = await this.receiptSer.find({
                where: {
                    guestId: guest.id
                },
                relations: {
                    detail: {
                        option:  {
                            product: true,
                            pictures: true
                        }
                    }
                }
            })
            if(receipts.length == 0) return [false, "Không tìm thấy đơn hàng!", null]
            if(!receipts) return [false, "Không tìm thấy đơn hàng!", null]
    
            return [true, "danh sách đơn hàng", receipts]
        }catch(err) {
            return [false, "lỗi model", null]
        }
    }
}