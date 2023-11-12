
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductOption } from "../productOptions/productOptions.entity";
import { Category } from "../categories/Category.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    categoryId: string;

    @ManyToOne(() => Category, (Category) => Category.Product)
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column()
    name: string;

    @Column()
    des: string;


    @OneToMany(() => ProductOption, (productOption) => productOption.product)
    options: ProductOption[];
}
