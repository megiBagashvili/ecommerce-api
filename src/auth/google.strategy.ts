import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(configService: ConfigService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
            passReqToCallback: false,
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
        const emails = profile?.emails || [];
        const user = {
            email: emails[0]?.value,
            firstName: profile?.name?.givenName,
            accessToken,
        };
        return user;
    }
}