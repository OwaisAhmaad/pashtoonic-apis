import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from '../../database/schemas/follow.schema';
import { Poetry, PoetrySchema } from '../../database/schemas/poetry.schema';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Poetry.name, schema: PoetrySchema },
      { name: Follow.name, schema: FollowSchema },
    ]),
  ],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
