import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Guest } from "./entities/guest.entity";

import { GuestController } from "./guest.controller";
import { GuestService } from "./guest.service";
import { Receipt } from "../receipt/entities/receipt.entity";
import { ReceiptDetail } from "../receipt/entities/receipt-detail.entity";
import { MailService } from "../mail/mail.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Guest, Receipt, ReceiptDetail])
    ],
    controllers: [GuestController],
    providers: [GuestService, MailService],
})
export class GuestModule {}