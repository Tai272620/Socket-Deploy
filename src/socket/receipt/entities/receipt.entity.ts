
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReceiptDetail } from "./receipt-detail.entity";
import { User } from "src/socket/users/entities/user.entity";
import { Guest } from "src/socket/guest/entities/guest.entity";


export enum ReceiptStatus {
    SHOPPING = "SHOPPING",
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    SHIPPING = "SHIPPING",
    DONE = "DONE"
}

export enum PayMode {
    CASH = "CASH",
    ZALO = "ZALO"
}

@Entity()
export class Receipt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        nullable: true
    })
    userId: string;

    @Column({
        nullable: true
    })
    guestId: string;

    @ManyToOne(() => User, (user) => user.receipts)
    @JoinColumn({ name: 'userId' })
    user: User;


    @ManyToOne(() => Guest, (guest) => guest.receipts)
    @JoinColumn({ name: 'guestId' })
    guest: Guest;

    @Column({
        default: 0
    })
    total: number;

    @Column({
        type: "enum",
        enum: ReceiptStatus,
        default: ReceiptStatus.SHOPPING
    })
    status: ReceiptStatus

    @Column({
        default: false
    })
    paid: boolean

    @Column({
        type: "enum",
        enum: PayMode,
        default: PayMode.CASH
    })
    payMode: PayMode

    @Column({
        nullable: true
    })
    paidAt: string

    @Column({
        nullable: true
    })
    zaloTranId: string



    @Column()
    createAt: string;

    @Column({
        nullable: true
    })
    accepted: string;

    @Column({
        nullable: true
    })
    shipAt: string;

    @Column({
        nullable: true
    })
    doneAt: string;

    @OneToMany(() => ReceiptDetail, (receiptDetail) => receiptDetail.receipt)
    detail: ReceiptDetail[];

    @BeforeInsert()
    hanldeSetCreateAt() {
        this.createAt = String(Date.now())
    }
}