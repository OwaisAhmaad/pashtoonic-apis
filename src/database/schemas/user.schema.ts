import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum UserLevel {
  NEWCOMER = 'Newcomer',
  EMERGING_VOICE = 'Emerging Voice',
  RISING_POET = 'Rising Poet',
  ESTABLISHED_POET = 'Established Poet',
  MASTER_POET = 'Master Poet',
}

@Schema({ _id: false })
class RefreshToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;
}
const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

@Schema({ _id: false })
class UserProfile {
  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  avatarUrl: string;
}
const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

@Schema({ _id: false })
class UserStats {
  @Prop({ default: 0 })
  approvedPostCount: number;

  @Prop({ default: 0 })
  totalLikesReceived: number;

  @Prop({ default: 0 })
  totalFollowers: number;

  @Prop({ default: 0 })
  totalFollowing: number;

  @Prop({ default: 0 })
  xp: number;
}
const UserStatsSchema = SchemaFactory.createForClass(UserStats);

@Schema({ _id: false })
class LevelInfo {
  @Prop({ default: UserLevel.NEWCOMER })
  currentLevel: string;

  @Prop({ default: 0 })
  progressPercent: number;
}
const LevelInfoSchema = SchemaFactory.createForClass(LevelInfo);

@Schema({ _id: false })
class Badge {
  @Prop({ required: true })
  name: string;

  @Prop({ default: Date.now })
  earnedAt: Date;
}
const BadgeSchema = SchemaFactory.createForClass(Badge);

@Schema({ _id: false })
class UserPreferences {
  @Prop({ default: 'ps' })
  language: string;

  @Prop({ default: true })
  emailNotifications: boolean;
}
const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  email: string;

  @Prop({ unique: true, lowercase: true, trim: true, required: true })
  username: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: [RefreshTokenSchema], default: [], select: false })
  refreshTokens: RefreshToken[];

  @Prop({ type: UserProfileSchema, default: () => ({}) })
  profile: UserProfile;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ type: UserStatsSchema, default: () => ({}) })
  stats: UserStats;

  @Prop({ type: LevelInfoSchema, default: () => ({}) })
  level: LevelInfo;

  @Prop({ type: [BadgeSchema], default: [] })
  badges: Badge[];

  @Prop({ type: UserPreferencesSchema, default: () => ({}) })
  preferences: UserPreferences;

  @Prop({ default: false })
  isSuspended: boolean;

  @Prop()
  suspendedUntil: Date;

  @Prop()
  suspensionReason: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true });
