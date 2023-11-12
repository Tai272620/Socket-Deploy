import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSocketGateway } from "./users/user.socket";
import { JwtService } from "./jwt/jwt.service";
import { CustomerChats } from "./customer/customer.entity";
import { Receipt } from "./receipt/entities/receipt.entity";
import { ReceiptDetail } from "./receipt/entities/receipt-detail.entity";


@Module({
    imports: [
        TypeOrmModule.forFeature([CustomerChats, Receipt, ReceiptDetail])
    ],
    providers: [JwtService, UserSocketGateway]

})
export class SocketModule { }
