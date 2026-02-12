import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty() email: string;
  @ApiProperty() otp: string;
}