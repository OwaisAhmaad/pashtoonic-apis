import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LevelRuleDocument = LevelRule & Document;

@Schema({ collection: 'level_rules' })
export class LevelRule {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  minXp: number;

  @Prop({ required: true })
  maxXp: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  order: number;
}

export const LevelRuleSchema = SchemaFactory.createForClass(LevelRule);
LevelRuleSchema.index({ minXp: 1 });
