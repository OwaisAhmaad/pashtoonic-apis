import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from '../../../database/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel.findById(payload.sub).lean();
    if (!user || !user.isActive) throw new UnauthorizedException();
    if (user.isSuspended) {
      if (!user.suspendedUntil || user.suspendedUntil > new Date()) {
        throw new UnauthorizedException('Account suspended');
      }
    }
    return {
      _id: user._id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      profile: user.profile,
    };
  }
}
