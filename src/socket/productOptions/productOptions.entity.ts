

import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReceiptDetail } from "../receipt/entities/receipt-detail.entity";
import { OptionPicture } from "../OptionPicture/optionsPicture.entity";
import { Product } from "../product/Product.entity";

@Entity()
export class ProductOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    productId: string;

    @ManyToOne(() => Product, (Product) => Product.options)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    price: number;


    @Column({
        default: false
    })
    status: boolean;

    @Column()
    title: string;

    @OneToMany(() => OptionPicture, (optionPicture) => optionPicture.option)
    pictures: OptionPicture[];

    @OneToMany(() => ReceiptDetail, (receiptDetail) => receiptDetail.option)
    sold: ReceiptDetail[];
}
