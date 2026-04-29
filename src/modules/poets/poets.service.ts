import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Poet, PoetDocument } from '../../database/schemas/poet.schema';
import { GamificationService } from '../gamification/gamification.service';
import { CreatePoetDto } from './dto/create-poet.dto';
import { UpdatePoetDto } from './dto/update-poet.dto';

@Injectable()
export class PoetsService {
  constructor(
    @InjectModel(Poet.name) private poetModel: Model<PoetDocument>,
    private gamificationService: GamificationService,
  ) {}

  async create(userId: string, dto: CreatePoetDto) {
    const existing = await this.poetModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (existing) throw new BadRequestException('Poet profile already exists');

    return this.poetModel.create({
      userId: new Types.ObjectId(userId),
      displayName: dto.displayName,
      bio: dto.bio,
      about: dto.about,
      avatarUrl: dto.avatarUrl,
      socialLinks: {
        twitter: dto.twitter ?? '',
        instagram: dto.instagram ?? '',
        website: dto.website ?? '',
      },
    });
  }

  async listVerified(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.poetModel
        .find({ isVerified: true, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username profile.displayName')
        .lean(),
      this.poetModel.countDocuments({ isVerified: true, isActive: true }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const poet = await this.poetModel
      .findById(id)
      .populate('userId', 'username profile')
      .lean();
    if (!poet || !poet.isActive) throw new NotFoundException('Poet not found');
    return poet;
  }

  async update(id: string, userId: string, dto: UpdatePoetDto) {
    const poet = await this.poetModel.findById(id);
    if (!poet || !poet.isActive) throw new NotFoundException('Poet not found');
    if (poet.userId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own poet profile');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.displayName) updateData.displayName = dto.displayName;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.about !== undefined) updateData.about = dto.about;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.twitter !== undefined) updateData['socialLinks.twitter'] = dto.twitter;
    if (dto.instagram !== undefined) updateData['socialLinks.instagram'] = dto.instagram;
    if (dto.website !== undefined) updateData['socialLinks.website'] = dto.website;

    return this.poetModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .lean();
  }

  async verify(id: string, moderatorId: string) {
    const poet = await this.poetModel.findById(id);
    if (!poet) throw new NotFoundException('Poet not found');

    await this.poetModel.findByIdAndUpdate(id, {
      $set: {
        isVerified: true,
        verifiedBy: new Types.ObjectId(moderatorId),
        verifiedAt: new Date(),
      },
    });

    await this.gamificationService.awardBadge(
      poet.userId.toString(),
      'verified_poet',
    );

    return { message: 'Poet verified' };
  }
}
