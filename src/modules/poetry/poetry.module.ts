import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Poetry, PoetrySchema } from '../../database/schemas/poetry.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { GamificationModule } from '../gamification/gamification.module';
import { PoetryController } from './poetry.controller';
import { PoetryService } from './poetry.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Poetry.name, schema: PoetrySchema },
      { name: User.name, schema: UserSchema },
    ]),
    GamificationModule,
  ],
  controllers: [PoetryController],
  providers: [PoetryService],
  exports: [PoetryService, MongooseModule],
})
export class PoetryModule {}
