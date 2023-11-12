import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../product/Product.entity";

@Entity()
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column("varchar", {
        unique: true,
        length: 50
    })
    title: string;

    @Column({
        default: false
    })
    status: boolean;

    @Column({
        default: "https://a0.anyrgb.com/pngimg/1236/14/no-facial-features-no-avatar-no-eyes-expressionless-avatar-icon-delayering-avatar-user-avatar-men-head-portrait-thumbnail.png"
    })
    avatar: string;

    @OneToMany(() => Product, (product) => product.category)
    Product: Product[]
}
