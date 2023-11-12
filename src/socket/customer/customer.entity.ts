
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/entities/user.entity";

@Entity()
export class CustomerChats {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.customerChats)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({
        nullable: true
    })
    adminId: string | null;

    @ManyToOne(() => User, (user) => user.adminChats)
    @JoinColumn({ name: 'adminId' })
    admin: User;

    @Column()
    content: string;

    @Column()
    time: string;

    @Column({ nullable: true })
    replyToId: string | null;

    @Column()
    discordChannelId: string;
}