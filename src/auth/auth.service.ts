import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async register(registerDto: RegisterDto) {
    const otp = Math.random().toString().slice(2, 8);
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    const user = await this.usersService.create({
      ...registerDto,
      otpCode: otp,
      otpCodeExpiration: expiry,
      isVerified: false,
    });

    await this.mailService.sendOTP(user.email, otp);
    return { message: 'Please check your email for the OTP code' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    if (user.isVerified) throw new BadRequestException('User already verified');

    if (user.otpCode !== otp) throw new BadRequestException('Invalid OTP');

    if (!user.otpCodeExpiration || new Date().getTime() > new Date(user.otpCodeExpiration).getTime())
      throw new BadRequestException('OTP expired');

    user.isVerified = true;
    user.otpCode = null;
    user.otpCodeExpiration = null;
    await user.save();

    return { message: 'Account verified successfully' };
  }

  async login(loginDto: any) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}