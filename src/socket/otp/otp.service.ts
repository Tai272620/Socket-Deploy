import * as fs from 'fs'
import * as path from 'path'

interface OtpObj {
    email: string;
    otp: string;
    createAt: number;
    activeTime: number;
}

function cleanOtp(otp: OtpObj): boolean {
    const currentTime = Date.now();
    const otpCreationTime = otp.createAt;
    const activeTime = otp.activeTime * 60 * 1000; // Chuyển đổi thành mili giây
    return (currentTime - otpCreationTime) < activeTime
}

function generateOTP(): string {
    var string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let OTP = '';
    var len = string.length;
    for (let i = 0; i < 6; i++) {
        OTP += string[Math.floor(Math.random() * len)];
    }
    return OTP;
}

export const createOtp = function (email: string, activeTime: number): {
    email: string;
    otp: string;
    createAt: string;
    activeTime: number;
} | null {
    try {
        let dataOtp = JSON.parse(fs.readFileSync("otp.json", 'utf-8') ?? "[]");
        let newOtp = {
            email,
            otp: generateOTP(),
            createAt: String(Date.now()),
            activeTime
        }
        dataOtp.push(newOtp);
        fs.writeFileSync("otp.json", JSON.stringify(dataOtp))
        return newOtp
    } catch (err) {
        return null
    }
}

export const checkOtp = function (email: string, otp: string): boolean {
    try {
        let dataOtp: OtpObj[] = JSON.parse(fs.readFileSync("otp.json", 'utf-8') ?? "[]");
        let tempOtpArray: OtpObj[] = [];
        let result = false;
        for (let i in dataOtp) {
            if (cleanOtp(dataOtp[i])) {
                if (dataOtp[i].email == email && dataOtp[i].otp == otp) {
                    result = true
                    continue
                }
                tempOtpArray.push(dataOtp[i])
            }
        }
        fs.writeFileSync(path.join(__dirname, "otp.json"), JSON.stringify(tempOtpArray))
        return result
    } catch (err) {
        return false
    }
}