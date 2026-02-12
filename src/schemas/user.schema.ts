import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ default: 'user' }) role: 'user' | 'admin';
  @Prop({ default: false }) isVerified: boolean;
  @Prop({ type: String, default: null }) otpCode: string | null;
  @Prop({ type: Date, default: null }) otpCodeExpiration: Date | null;
}
export const UserSchema = SchemaFactory.createForClass(User);