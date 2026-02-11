import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { Cart } from '../schemas/cart.schema';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class OrdersService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    private configService: ConfigService,
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

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      metadata: { userId },
    });

    const order = new this.orderModel({
      userId,
      items: cart.items,
      totalAmount,
      paymentIntentId: paymentIntent.id,
      status: 'pending',
    });
    await order.save();

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      totalAmount,
    };
  }
}