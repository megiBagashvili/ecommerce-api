import { Controller, Post, Body, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addItem(@Req() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItemToCart(req.user.userId, addToCartDto);
  }

  @Get()
  async getCart(@Req() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Delete(':productId')
  async removeItem(@Req() req, @Param('productId') productId: string) {
    return this.cartService.removeItemFromCart(req.user.userId, productId);
  }
}