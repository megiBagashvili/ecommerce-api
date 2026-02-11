import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty() productId: string;
  @ApiProperty({ default: 1 }) quantity: number;
}