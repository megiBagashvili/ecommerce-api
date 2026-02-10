import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() price: number;
  @ApiProperty() stock: number;
  @ApiProperty({ type: 'string', format: 'binary', description: 'Product Image' })
  image: any;
}