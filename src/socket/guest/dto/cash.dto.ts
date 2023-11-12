import { IsEmail, IsNotEmpty, IsNumber } from "class-validator";

export class GuestDto {
    @IsNotEmpty()
    name: string;
    @IsNotEmpty()
    numberPhone: string;
    @IsEmail()
    email: string;
}

export class ReceiptDetailDto {
    @IsNotEmpty()
    optionId: string;
    @IsNotEmpty()
    quantity: number;
}

export class CashDto {
    @IsNotEmpty()
    guest: GuestDto;
    @IsNotEmpty()
    receiptDetails: ReceiptDetailDto[];
    @IsNotEmpty()
    payMode: string;
    @IsNotEmpty()
    @IsNumber()
    total: number;
}