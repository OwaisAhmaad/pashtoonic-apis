import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import {
  Poetry,
  PoetryDocument,
  PoetryStatus,
} from '../../database/schemas/poetry.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import {
  GamificationService,
  XpAction,
} from '../gamification/gamification.service';
import { CreatePoetryDto } from './dto/create-poetry.dto';
import { PoetrySortOption, QueryPoetryDto } from './dto/query-poetry.dto';
import { UpdatePoetryDto } from './dto/update-poetry.dto';

@Injectable()
export class PoetryService {
  constructor(
    @InjectModel(Poetry.name) private poetryModel: Model<PoetryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private gamificationService: GamificationService,
  ) {}

  async list(query: QueryPoetryDto) {
    const filter: Record<string, unknown> = {
      status: PoetryStatus.APPROVED,
      isDeleted: false,
    };
    if (query.language) filter.language = query.language;
    if (query.type) filter.type = query.type;

    if (query.cursor) {
      const cursorId = Buffer.from(query.cursor, 'base64').toString('utf-8');
      filter._id = { $lt: new Types.ObjectId(cursorId) };
    }

    let sortOption: Record<string, SortOrder> = { createdAt: -1 };
    if (query.sort === PoetrySortOption.POPULAR) {
      sortOption = { 'engagement.likeCount': -1, createdAt: -1 };
    } else if (query.sort === PoetrySortOption.TRENDING) {
      sortOption = { 'engagement.engagementScore': -1, createdAt: -1 };
    }

    const limit = query.limit ?? 20;
    const items = await this.poetryModel
      .find(filter)
      .sort(sortOption)
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

  async create(userId: string, dto: CreatePoetryDto) {
    const poetry = await this.poetryModel.create({
      title: dto.title,
      content: dto.content,
      language: dto.language,
      type: dto.type,
      tags: dto.tags ?? [],
      authorId: new Types.ObjectId(userId),
      status: PoetryStatus.PENDING,
      mediaUrls: {
        coverImage: dto.coverImage ?? '',
        audioUrl: dto.audioUrl ?? '',
      },
    });
    return poetry;
  }

  async findById(id: string) {
    const poetry = await this.poetryModel
      .findOne({ _id: id, isDeleted: false })
      .populate('authorId', 'username profile.displayName profile.avatarUrl')
      .lean();
    if (!poetry) throw new NotFoundException('Poem not found');
    if (poetry.status !== PoetryStatus.APPROVED) {
      // still return it (moderators/owners may view)
    }
    return poetry;
  }

  async update(id: string, userId: string, dto: UpdatePoetryDto) {
    const poetry = await this.poetryModel.findOne({ _id: id, isDeleted: false });
    if (!poetry) throw new NotFoundException('Poem not found');
    if (poetry.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own poems');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.content) updateData.content = dto.content;
    if (dto.language) updateData.language = dto.language;
    if (dto.type) updateData.type = dto.type;
    if (dto.tags) updateData.tags = dto.tags;
    if (dto.coverImage !== undefined) updateData['mediaUrls.coverImage'] = dto.coverImage;
    if (dto.audioUrl !== undefined) updateData['mediaUrls.audioUrl'] = dto.audioUrl;

    return this.poetryModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .lean();
  }

  async softDelete(id: string, userId: string, userRoles: string[]) {
    const poetry = await this.poetryModel.findOne({ _id: id, isDeleted: false });
    if (!poetry) throw new NotFoundException('Poem not found');

    const isOwner = poetry.authorId.toString() === userId;
    const isAdminOrMod =
      userRoles.includes('ADMIN') || userRoles.includes('MODERATOR');

    if (!isOwner && !isAdminOrMod) {
      throw new ForbiddenException('Permission denied');
    }

    await this.poetryModel.findByIdAndUpdate(id, {
      $set: { isDeleted: true, deletedAt: new Date() },
    });
    return { message: 'Poem deleted' };
  }

  async search(q: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.poetryModel
        .find(
          { $text: { $search: q }, status: PoetryStatus.APPROVED, isDeleted: false },
          { score: { $meta: 'textScore' } },
        )
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'username profile.displayName')
        .lean(),
      this.poetryModel.countDocuments({
        $text: { $search: q },
        status: PoetryStatus.APPROVED,
        isDeleted: false,
      }),
    ]);
    return { items, total, page, limit };
  }

  async getFeatured(limit: number = 20) {
    return this.poetryModel
      .find({ isFeatured: true, status: PoetryStatus.APPROVED, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'username profile.displayName profile.avatarUrl')
      .lean();
  }

  async getTrending(limit: number = 20) {
    return this.poetryModel
      .find({ status: PoetryStatus.APPROVED, isDeleted: false })
      .sort({ 'engagement.engagementScore': -1, createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'username profile.displayName profile.avatarUrl')
      .lean();
  }

  async approve(id: string, moderatorId: string) {
    const poetry = await this.poetryModel.findOne({ _id: id, isDeleted: false });
    if (!poetry) throw new NotFoundException('Poem not found');

    await this.poetryModel.findByIdAndUpdate(id, {
      $set: {
        status: PoetryStatus.APPROVED,
        'moderation.reviewedBy': new Types.ObjectId(moderatorId),
        'moderation.reviewedAt': new Date(),
      },
    });

    // Award XP and update stats
    await Promise.all([
      this.gamificationService.awardXp(
        poetry.authorId.toString(),
        XpAction.POEM_APPROVED,
      ),
      this.userModel.findByIdAndUpdate(poetry.authorId, {
        $inc: { 'stats.approvedPostCount': 1 },
      }),
    ]);

    return { message: 'Poem approved' };
  }

  async reject(id: string, moderatorId: string, reason: string) {
    const poetry = await this.poetryModel.findOne({ _id: id, isDeleted: false });
    if (!poetry) throw new NotFoundException('Poem not found');

    await this.poetryModel.findByIdAndUpdate(id, {
      $set: {
        status: PoetryStatus.REJECTED,
        'moderation.reviewedBy': new Types.ObjectId(moderatorId),
        'moderation.reviewedAt': new Date(),
        'moderation.rejectionReason': reason,
      },
    });
    return { message: 'Poem rejected' };
  }

  async toggleFeatured(id: string) {
    const poetry = await this.poetryModel.findOne({ _id: id, isDeleted: false });
    if (!poetry) throw new NotFoundException('Poem not found');
    const updated = await this.poetryModel
      .findByIdAndUpdate(
        id,
        { $set: { isFeatured: !poetry.isFeatured } },
        { new: true },
      )
      .lean();
    return updated;
  }

  async recalculateEngagement(poetryId: string | Types.ObjectId) {
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
