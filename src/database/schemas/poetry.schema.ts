import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PoetryDocument = Poetry & Document;

export enum PoetryLanguage {
  PS = 'ps',
  UR = 'ur',
  EN = 'en',
}

export enum PoetryType {
  GHAZAL = 'GHAZAL',
  NAZM = 'NAZM',
  TAPA = 'TAPA',
  RUBAIYAT = 'RUBAIYAT',
  CHARBAITA = 'CHARBAITA',
  SANDARA = 'SANDARA',
  OTHER = 'OTHER',
}

export enum PoetryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
}

@Schema({ _id: false })
class PoetryMetadata {
  @Prop({ default: '' })
  meter: string;

  @Prop({ default: '' })
  rhymeScheme: string;

  @Prop({ default: '' })
  occasion: string;
}
const PoetryMetadataSchema = SchemaFactory.createForClass(PoetryMetadata);

@Schema({ _id: false })
class PoetryMediaUrls {
  @Prop({ default: '' })
  coverImage: string;

  @Prop({ default: '' })
  audioUrl: string;
}
const PoetryMediaUrlsSchema = SchemaFactory.createForClass(PoetryMediaUrls);

@Schema({ _id: false })
class PoetryEngagement {
  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  avgRating: number;

  @Prop({ default: 0 })
  engagementScore: number;
}
const PoetryEngagementSchema = SchemaFactory.createForClass(PoetryEngagement);

@Schema({ _id: false })
class PoetryModeration {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop()
  reviewedAt: Date;

  @Prop({ default: '' })
  rejectionReason: string;
}
const PoetryModerationSchema = SchemaFactory.createForClass(PoetryModeration);

@Schema({ timestamps: true, collection: 'poetry' })
export class Poetry {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: PoetryLanguage, default: PoetryLanguage.PS })
  language: PoetryLanguage;

  @Prop({ type: String, enum: PoetryType, default: PoetryType.OTHER })
  type: PoetryType;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Poet' })
  poetId: Types.ObjectId;

  @Prop({ type: String, enum: PoetryStatus, default: PoetryStatus.PENDING })
  status: PoetryStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: PoetryMetadataSchema, default: () => ({}) })
  metadata: PoetryMetadata;

  @Prop({ type: PoetryMediaUrlsSchema, default: () => ({}) })
  mediaUrls: PoetryMediaUrls;

  @Prop({ type: PoetryEngagementSchema, default: () => ({}) })
  engagement: PoetryEngagement;

  @Prop({ type: PoetryModerationSchema, default: () => ({}) })
  moderation: PoetryModeration;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const PoetrySchema = SchemaFactory.createForClass(Poetry);

PoetrySchema.index({ title: 'text', content: 'text', tags: 'text' });
PoetrySchema.index({ status: 1, language: 1, createdAt: -1 });
PoetrySchema.index({ authorId: 1, status: 1 });
PoetrySchema.index({ isFeatured: 1, status: 1 });
PoetrySchema.index({ 'engagement.engagementScore': -1, status: 1 });
PoetrySchema.index({ isDeleted: 1 });
