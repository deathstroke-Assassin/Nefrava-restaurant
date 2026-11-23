const nodemailer = require('nodemailer');

function createTransporter() {
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;

    return nodemailer.createTransport({
        host: process.env.MAIL_HOST || '127.0.0.1',
        port: Number(process.env.MAIL_PORT || 1025),
        secure: process.env.MAIL_SECURE === 'true',
        ...(user && pass ? { auth: { user, pass } } : {})
    });
}

function send({ to, subject, text }) {
    return createTransporter().sendMail({
        from: process.env.MAIL_FROM || 'NEFRAVA <no-reply@nefrava.test>',
        to,
        subject,
        text
    });
}

module.exports = { send };
