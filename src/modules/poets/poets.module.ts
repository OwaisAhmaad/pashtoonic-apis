import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Poet, PoetSchema } from '../../database/schemas/poet.schema';
import { GamificationModule } from '../gamification/gamification.module';
import { PoetsController } from './poets.controller';
import { PoetsService } from './poets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Poet.name, schema: PoetSchema }]),
    GamificationModule,
  ],
  controllers: [PoetsController],
  providers: [PoetsService],
  exports: [PoetsService],
})
export class PoetsModule {}
