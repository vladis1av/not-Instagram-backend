import nodemailer from 'nodemailer';

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.NODEMAILER_PORT) || 2525,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });
  }

  async sendActivationMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.NODEMAILER_USER,
      to,
      subject: 'Активация аккаунта для ' + process.env.CLIENT_URL,
      text: '',
      html: `
      <div>
        <h1>Для активации перейдите по ссылке</h1>
        <a href="${link}">${link}</a>
      </div>
      `,
    });
  }
}

const mailService = new MailService();

export default mailService;
