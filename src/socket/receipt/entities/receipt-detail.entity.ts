import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Receipt } from "./receipt.entity";
import { ProductOption } from "src/socket/productOptions/productOptions.entity";

@Entity()
export class ReceiptDetail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    receiptId: string;
    @ManyToOne(() => Receipt, (receipt) => receipt.detail)
    @JoinColumn({ name: 'receiptId' })
    receipt: Receipt;


    @Column()
    optionId: string;
    @ManyToOne(() => ProductOption, (productOption) => productOption.sold)
    @JoinColumn({ name: 'optionId' })
    option: ProductOption;

    @Column()
    quantity: number
}