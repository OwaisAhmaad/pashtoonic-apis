import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from '../../database/schemas/follow.schema';
import { Poetry, PoetryDocument, PoetryStatus } from '../../database/schemas/poetry.schema';

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Poetry.name) private poetryModel: Model<PoetryDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
  ) {}

  async getPersonalizedFeed(userId: string, cursor?: string, limit: number = 20) {
    // Get who the user follows
    const follows = await this.followModel
      .find({ followerId: new Types.ObjectId(userId) })
      .select('followingId')
      .lean();

    const followingIds = follows.map((f) => f.followingId);

    const filter: Record<string, unknown> = {
      status: PoetryStatus.APPROVED,
      isDeleted: false,
      $or: [
        { authorId: { $in: followingIds } },
        { isFeatured: true },
      ],
    };

    if (cursor) {
      const cursorId = Buffer.from(cursor, 'base64').toString('utf-8');
      filter._id = { $lt: new Types.ObjectId(cursorId) };
    }

    const items = await this.poetryModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('authorId', 'username profile.displayName profile.avatarUrl')
      .lean();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && data.length > 0
        ? Buffer.from((data[data.length - 1] as any)._id.toString()).toString('base64')
        : null;

    return { items: data, nextCursor, hasMore };
  }

  async getExploreFeed(cursor?: string, limit: number = 20) {
    const filter: Record<string, unknown> = {
      status: PoetryStatus.APPROVED,
      isDeleted: false,
    };

    if (cursor) {
      const cursorId = Buffer.from(cursor, 'base64').toString('utf-8');
      filter._id = { $lt: new Types.ObjectId(cursorId) };
    }

    const items = await this.poetryModel
      .find(filter)
      .sort({ 'engagement.engagementScore': -1, createdAt: -1 })
      .limit(limit + 1)
      .populate('authorId', 'username profile.displayName profile.avatarUrl')
      .lean();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && data.length > 0
        ? Buffer.from((data[data.length - 1] as any)._id.toString()).toString('base64')
        : null;

    return { items: data, nextCursor, hasMore };
  }
}
