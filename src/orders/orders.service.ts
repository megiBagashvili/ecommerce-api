import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { Cart } from '../schemas/cart.schema';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class OrdersService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  async checkout(userId: string) {
    const cart = await this.cartModel.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const totalAmount = cart.items.reduce((sum, item: any) => {
      return sum + item.productId.price * item.quantity;
    }, 0);

    const line_items = cart.items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productId.name || item.productId.title || 'Product',
          description: item.productId.description || '',
          images: (item.productId.images && item.productId.images.slice(0, 1)) || [],
        },
        unit_amount: Math.round(item.productId.price * 100),
      },
      quantity: item.quantity,
    }));

    const rawFrontend = (this.configService.get('FRONT_END_URL') as string) || 'http://localhost:3000';
    const frontend = /^https?:\/\//i.test(rawFrontend) ? rawFrontend : `https://${rawFrontend}`;
    const baseFrontend = frontend.replace(/\/$/, '');
    const successUrl = `${baseFrontend}/?success=true`;
    const cancelUrl = `${baseFrontend}/?canceled=true`;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      payment_intent_data: {
        metadata: { userId },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    await this.orderModel.deleteMany({ userId, status: 'pending' });

    const order = new this.orderModel({
      userId,
      items: cart.items,
      totalAmount,
      sessionId: session.id,
      paymentIntentId: (session.payment_intent as string) || undefined,
      status: 'pending',
    });
    await order.save();

    return {
      url: session.url,
      sessionId: session.id,
      orderId: order._id,
      totalAmount,
    };
  }

  async markOrderAsPaid(sessionOrPaymentId: string) {
    const order = await this.orderModel.findOneAndUpdate(
      { $or: [{ sessionId: sessionOrPaymentId }, { paymentIntentId: sessionOrPaymentId }] },
      { status: 'paid' },
      { new: true }
    ).populate('userId');

    if (order) {
      await this.cartModel.deleteOne({ userId: order.userId });
      const userEmail = (order.userId as any).email;
      await this.mailService.sendOrderConfirmation(
        userEmail,
        order._id.toString(),
        order.totalAmount
      );
    }
    return order;
  }

  async findUserOrders(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}