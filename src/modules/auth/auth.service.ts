import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../../database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new BadRequestException(
        existing.email === dto.email
          ? 'Email already registered'
          : 'Username already taken',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      profile: { displayName: dto.displayName },
      roles: [UserRole.USER],
    });

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user._id as Types.ObjectId, tokens.refreshToken);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+passwordHash');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account deactivated');
    if (user.isSuspended && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
      throw new UnauthorizedException('Account suspended');
    }

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user._id as Types.ObjectId, tokens.refreshToken);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refresh(refreshToken: string) {
    const user = await this.userModel
      .findOne({ 'refreshTokens.token': refreshToken })
      .select('+refreshTokens');

    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const tokenEntry = user.refreshTokens.find((t) => t.token === refreshToken);
    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate: remove old, add new
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
    const tokens = await this.generateTokens(user);
    const expiryDays = 7;
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
    });
    await user.save();
    return tokens;
  }

  async logout(refreshToken: string) {
    await this.userModel.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } },
    );
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: UserDocument) {
    const payload: JwtPayload = {
      sub: (user._id as Types.ObjectId).toString(),
      email: user.email,
      roles: user.roles,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret') as string,
      expiresIn: (this.configService.get<string>('jwt.expiresIn') ?? '15m') as any,
    });

    const refreshToken = uuidv4();
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: Types.ObjectId, token: string) {
    const expiryDays = 7;
    await this.userModel.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: {
            token,
            expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
          },
        },
      },
    );
  }

  private sanitizeUser(user: UserDocument) {
    return {
      _id: user._id,
      email: user.email,
      username: user.username,
      profile: user.profile,
      roles: user.roles,
    };
  }
}
