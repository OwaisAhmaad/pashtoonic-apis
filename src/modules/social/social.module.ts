import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../../database/schemas/comment.schema';
import { Follow, FollowSchema } from '../../database/schemas/follow.schema';
import { Like, LikeSchema } from '../../database/schemas/like.schema';
import { Poetry, PoetrySchema } from '../../database/schemas/poetry.schema';
import { Review, ReviewSchema } from '../../database/schemas/review.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { GamificationModule } from '../gamification/gamification.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Poetry.name, schema: PoetrySchema },
      { name: User.name, schema: UserSchema },
    ]),
    GamificationModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
