import { Receipt } from "src/socket/receipt/entities/receipt.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Guest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    numberPhone: string;

    @Column({
        unique: true
    })
    email: string;

    @OneToMany(() => Receipt, (receipt) => receipt.guest)
    receipts: Receipt[];
}