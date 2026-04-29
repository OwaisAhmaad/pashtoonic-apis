import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PoetDocument = Poet & Document;

@Schema({ _id: false })
class SocialLinks {
  @Prop({ default: '' })
  twitter: string;

  @Prop({ default: '' })
  instagram: string;

  @Prop({ default: '' })
  website: string;
}
const SocialLinksSchema = SchemaFactory.createForClass(SocialLinks);

@Schema({ timestamps: true, collection: 'poets' })
export class Poet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  about: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId;

  @Prop()
  verifiedAt: Date;

  @Prop({ type: SocialLinksSchema, default: () => ({}) })
  socialLinks: SocialLinks;

  @Prop({ default: true })
  isActive: boolean;
}

export const PoetSchema = SchemaFactory.createForClass(Poet);
PoetSchema.index({ userId: 1 }, { unique: true });
PoetSchema.index({ isVerified: 1 });
