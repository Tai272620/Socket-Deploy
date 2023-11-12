import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductOption } from "../productOptions/productOptions.entity";

@Entity()
export class OptionPicture {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    optionId: string;

    @ManyToOne(() => ProductOption, (productOption) => productOption.pictures)
    @JoinColumn({ name: 'optionId' })
    option: ProductOption;

    @Column()
    icon: string;
}

