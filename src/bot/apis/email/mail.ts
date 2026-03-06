import nm from 'nodemailer';

let transporter: nm.Transporter | null = null;

export async function init() {
    transporter = nm.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EB_EMAIL_USER,
            pass: process.env.EB_EMAIL_PASS
        }
    });
}

export interface Email {
    receiver: string;
    subject: string;
    content: string;
};

export async function sendMessage({ receiver, subject, content }: Email) {
    if (transporter == null) {
        throw new Error('Email not initialized');
    }

    return transporter.sendMail({
        from: process.env.EB_EMAIL_USER,
        to: receiver,
        subject: subject,
        text: content,
    })
}
