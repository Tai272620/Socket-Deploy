import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { CashDto } from "./dto/cash.dto";
import { GuestService } from "./guest.service";
import { Response } from 'express';
import { MailService } from "../mail/mail.service";
import { checkOtp, createOtp } from '../otp/otp.service'
@Controller('guest')
export class GuestController {
    constructor(private readonly guestSer: GuestService, private readonly mail: MailService) { }

    @Post()
    async cash(@Body() body: CashDto, @Res() res: Response) {
        try {
            console.log("body", body);

            let [status, message] = await this.guestSer.create(body.receiptDetails, body.guest, body.payMode, body.total);
            return res.status(status ? 200 : 213).json({
                message
            })
        } catch (err) {
            return res.status(500).json({
                message: "Thất bại!"
            })
        }
    }

    @Get()
    async history(@Query('otp') otp: string, @Query('email') email: string, @Res() res: Response) {
        try {
            console.log("email", email)
            console.log("otp", otp)
            if (otp) {
                /* Check OTP and Return Receipts */
                if (checkOtp(email, otp)) {
                    let [status, message, data] = await this.guestSer.findReceipts(email);
                    return res.status(status ? 200 : 213).json({
                        message,
                        data
                    })
                }
                return res.status(213).json({
                    message: "OTP không hợp lệ!"
                })
            } else {
                /* Send OTP */
                this.mail.sendMail({
                    to: email,
                    subject: "OTP",
                    text: `OTP là:${createOtp(email, 5)?.otp ?? "000000"} sẽ hết hạn sau 5'`,
                });
                return res.status(200).json({
                    message: "OTP đã gửi tới email!"
                })
            }
        } catch (err) {
            return res.status(500).json({
                message: "Thất bại!"
            })
        }
    }

}