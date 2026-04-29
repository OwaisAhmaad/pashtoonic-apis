import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../../database/schemas/comment.schema';
import { Follow, FollowDocument } from '../../database/schemas/follow.schema';
import { Like, LikeDocument } from '../../database/schemas/like.schema';
import { Poetry, PoetryDocument } from '../../database/schemas/poetry.schema';
import { Review, ReviewDocument } from '../../database/schemas/review.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import {
  GamificationService,
  XpAction,
} from '../gamification/gamification.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(Poetry.name) private poetryModel: Model<PoetryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private gamificationService: GamificationService,
  ) {}

  // ─── Likes ───────────────────────────────────────────────────────────────────

  async toggleLike(poetryId: string, userId: string) {
    const poetry = await this.poetryModel.findById(poetryId);
    if (!poetry) throw new NotFoundException('Poem not found');

    const existing = await this.likeModel.findOne({
      userId: new Types.ObjectId(userId),
      poetryId: new Types.ObjectId(poetryId),
    });

    if (existing) {
      await this.likeModel.deleteOne({ _id: existing._id });
      await this.poetryModel.findByIdAndUpdate(poetryId, {
        $inc: { 'engagement.likeCount': -1 },
      });
      await this.userModel.findByIdAndUpdate(poetry.authorId, {
        $inc: { 'stats.totalLikesReceived': -1 },
      });
      await this.recalculateEngagement(poetryId);
      return { liked: false };
    }

    await this.likeModel.create({
      userId: new Types.ObjectId(userId),
      poetryId: new Types.ObjectId(poetryId),
    });
    await this.poetryModel.findByIdAndUpdate(poetryId, {
      $inc: { 'engagement.likeCount': 1 },
    });
    await this.userModel.findByIdAndUpdate(poetry.authorId, {
      $inc: { 'stats.totalLikesReceived': 1 },
    });
    await this.recalculateEngagement(poetryId);
    await this.gamificationService.awardXp(
      poetry.authorId.toString(),
      XpAction.LIKE_RECEIVED,
    );
    return { liked: true };
  }

  async getLikes(poetryId: string, userId?: string) {
    const poetry = await this.poetryModel
      .findById(poetryId)
      .select('engagement.likeCount');
    if (!poetry) throw new NotFoundException('Poem not found');

    const likedByUser = userId
      ? !!(await this.likeModel.findOne({
          userId: new Types.ObjectId(userId),
          poetryId: new Types.ObjectId(poetryId),
        }))
      : false;

    return { likeCount: poetry.engagement.likeCount, likedByUser };
  }

  // ─── Comments ─────────────────────────────────────────────────────────────────

  async getComments(poetryId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.commentModel
        .find({ poetryId: new Types.ObjectId(poetryId), parentId: null, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username profile.displayName profile.avatarUrl')
        .lean(),
      this.commentModel.countDocuments({
        poetryId: new Types.ObjectId(poetryId),
        parentId: null,
        isDeleted: false,
      }),
    ]);

    // attach replies
    const parentIds = items.map((c: any) => c._id);
    const replies = await this.commentModel
      .find({
        poetryId: new Types.ObjectId(poetryId),
        parentId: { $in: parentIds },
        isDeleted: false,
      })
      .populate('userId', 'username profile.displayName profile.avatarUrl')
      .lean();

    const repliesMap: Record<string, typeof replies> = {};
    replies.forEach((r: any) => {
      const key = r.parentId.toString();
      if (!repliesMap[key]) repliesMap[key] = [];
      repliesMap[key].push(r);
    });

    const enriched = items.map((c: any) => ({
      ...c,
      replies: repliesMap[c._id.toString()] ?? [],
    }));

    return { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async addComment(poetryId: string, userId: string, dto: CreateCommentDto) {
    const poetry = await this.poetryModel.findById(poetryId);
    if (!poetry) throw new NotFoundException('Poem not found');

    const comment = await this.commentModel.create({
      userId: new Types.ObjectId(userId),
      poetryId: new Types.ObjectId(poetryId),
      content: dto.content,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
    });

    await this.poetryModel.findByIdAndUpdate(poetryId, {
      $inc: { 'engagement.commentCount': 1 },
    });
    await this.recalculateEngagement(poetryId);

    await this.gamificationService.awardXp(userId, XpAction.COMMENT_POSTED);
    await this.gamificationService.awardBadge(userId, 'first_comment');

    return comment;
  }

  async deleteComment(poetryId: string, commentId: string, userId: string, userRoles: string[]) {
    const comment = await this.commentModel.findOne({
      _id: commentId,
      poetryId: new Types.ObjectId(poetryId),
      isDeleted: false,
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const isOwner = comment.userId.toString() === userId;
    const isAdminOrMod = userRoles.includes('ADMIN') || userRoles.includes('MODERATOR');
    if (!isOwner && !isAdminOrMod) throw new ForbiddenException('Permission denied');

    await this.commentModel.findByIdAndUpdate(commentId, {
      $set: { isDeleted: true },
    });
    await this.poetryModel.findByIdAndUpdate(poetryId, {
      $inc: { 'engagement.commentCount': -1 },
    });
    await this.recalculateEngagement(poetryId);
    return { message: 'Comment deleted' };
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────────

  async getReviews(poetryId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.reviewModel
        .find({ poetryId: new Types.ObjectId(poetryId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username profile.displayName profile.avatarUrl')
        .lean(),
      this.reviewModel.countDocuments({ poetryId: new Types.ObjectId(poetryId) }),
    ]);

    const avgRating = items.length
      ? items.reduce((sum: number, r: any) => sum + r.rating, 0) / items.length
      : 0;

    return { items, total, page, limit, avgRating: Math.round(avgRating * 10) / 10 };
  }

  async submitReview(poetryId: string, userId: string, dto: CreateReviewDto) {
    const poetry = await this.poetryModel.findById(poetryId);
    if (!poetry) throw new NotFoundException('Poem not found');

    const existing = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      poetryId: new Types.ObjectId(poetryId),
    });
    if (existing) throw new BadRequestException('You have already reviewed this poem');

    const review = await this.reviewModel.create({
      userId: new Types.ObjectId(userId),
      poetryId: new Types.ObjectId(poetryId),
      rating: dto.rating,
      content: dto.content,
    });

    // Recalculate average rating
    const allReviews = await this.reviewModel
      .find({ poetryId: new Types.ObjectId(poetryId) })
      .select('rating')
      .lean();
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await this.poetryModel.findByIdAndUpdate(poetryId, {
      $set: { 'engagement.avgRating': Math.round(avgRating * 10) / 10 },
      $inc: { 'engagement.reviewCount': 1 },
    });
    await this.recalculateEngagement(poetryId);

    await this.gamificationService.awardXp(userId, XpAction.REVIEW_SUBMITTED);
    return review;
  }

  // ─── Follows ──────────────────────────────────────────────────────────────────

  async toggleFollow(targetUserId: string, followerId: string) {
    if (targetUserId === followerId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const target = await this.userModel.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.followModel.findOne({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(targetUserId),
    });

    if (existing) {
      await this.followModel.deleteOne({ _id: existing._id });
      await Promise.all([
        this.userModel.findByIdAndUpdate(followerId, {
          $inc: { 'stats.totalFollowing': -1 },
        }),
        this.userModel.findByIdAndUpdate(targetUserId, {
          $inc: { 'stats.totalFollowers': -1 },
        }),
      ]);
      return { following: false };
    }

    await this.followModel.create({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(targetUserId),
    });
    await Promise.all([
      this.userModel.findByIdAndUpdate(followerId, {
        $inc: { 'stats.totalFollowing': 1 },
      }),
      this.userModel.findByIdAndUpdate(targetUserId, {
        $inc: { 'stats.totalFollowers': 1 },
      }),
    ]);
    await this.gamificationService.awardXp(targetUserId, XpAction.FOLLOWER_GAINED);
    return { following: true };
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.followModel
        .find({ followingId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followerId', 'username profile.displayName profile.avatarUrl')
        .lean(),
      this.followModel.countDocuments({ followingId: new Types.ObjectId(userId) }),
    ]);
    return { items, total, page, limit };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.followModel
        .find({ followerId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followingId', 'username profile.displayName profile.avatarUrl')
        .lean(),
      this.followModel.countDocuments({ followerId: new Types.ObjectId(userId) }),
    ]);
    return { items, total, page, limit };
  }

  private async recalculateEngagement(poetryId: string) {
    const poetry = await this.poetryModel.findById(poetryId);
    if (!poetry) return;
    const { likeCount, commentCount, reviewCount, avgRating } = poetry.engagement;
    const engagementScore =
      likeCount * 1 + commentCount * 3 + reviewCount * 5 + avgRating * 10;
    await this.poetryModel.findByIdAndUpdate(poetryId, {
      $set: { 'engagement.engagementScore': engagementScore },
    });
  }
}
