import * as Mailgen from 'mailgen';

interface MailBody {
    productName: string;
    productWebUrl: string;
    receiverName: string;
    confirmLink: string;
    language: string;
}

function genEmailString(mailBody: MailBody) {
    let mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: mailBody.productName,
            link: mailBody.productWebUrl
        }
    });

    let email = {
        body: {
            greeting: "Hello",
            signature: "XIn chào",
            name: mailBody.receiverName,
            intro: "Chúng tôi là",
            action: {
                instructions: `XIn chào ${mailBody.productName} bấm vào nút xác nhận!}`,
                button: {
                    color: '#22BC66',
                    text: "Xác nhận",
                    link: mailBody.confirmLink
                }
            },
            outro: `Outro`
        }
    };

    return mailGenerator.generate(email);
}

export default genEmailString;