import { Controller, Post, Get, UseGuards, Req, Headers, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Stripe } from 'stripe';
import { ConfigService } from '@nestjs/config';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  private stripe: Stripe;

  constructor(
    private readonly ordersService: OrdersService,
    private configService: ConfigService
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@Req() req) {
    return this.ordersService.checkout(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Req() req) {
    return this.ordersService.findUserOrders(req.user.userId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    const rawBody = (req as RawBodyRequest<Request>).rawBody;

    if (!rawBody) {
      throw new BadRequestException('Raw body not found');
    }

    if (!sig || !webhookSecret) {
      throw new BadRequestException('Missing stripe signature or secret');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // mark order paid by session ID (preferred for Checkout Sessions)
      await this.ordersService.markOrderAsPaid(session.id);
    } else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // fallback for flows that only deliver payment_intent events
      await this.ordersService.markOrderAsPaid(paymentIntent.id);
    }

    return { received: true };
  }
}