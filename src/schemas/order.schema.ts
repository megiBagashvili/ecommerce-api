import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: string;
  @Prop() items: any[];
  @Prop({ required: true }) totalAmount: number;
  @Prop({ default: 'pending' }) status: 'pending' | 'paid' | 'shipped';
  @Prop() sessionId: string;
  @Prop() paymentIntentId: string;
}
export const OrderSchema = SchemaFactory.createForClass(Order);