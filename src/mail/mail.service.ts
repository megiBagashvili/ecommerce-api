import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOTP(to: string, otp: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Verify your Account',
      html: `<h1>Your OTP is: ${otp}</h1><p>It expires in 5 minutes.</p>`,
    });
  }

  async sendOrderConfirmation(to: string, orderId: string, amount: number) {
    await this.mailerService.sendMail({
      to,
      subject: 'Order Confirmed!',
      html: `<h2>Thanks for your purchase!</h2><p>Order ID: ${orderId}</p><p>Total Paid: $${amount}</p>`,
    });
  }
}