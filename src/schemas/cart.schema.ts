import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: string;
  @Prop([{
    productId: { type: Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }]) items: any[];
}
export const CartSchema = SchemaFactory.createForClass(Cart);