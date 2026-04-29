import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Poetry,
  PoetryDocument,
  PoetryStatus,
} from '../../database/schemas/poetry.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { PoetryService } from '../poetry/poetry.service';
import { RejectPoemDto } from './dto/reject-poem.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Poetry.name) private poetryModel: Model<PoetryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private poetryService: PoetryService,
  ) {}

  async getModerationQueue(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.poetryModel
        .find({ status: PoetryStatus.PENDING, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'username profile.displayName')
        .lean(),
      this.poetryModel.countDocuments({
        status: PoetryStatus.PENDING,
        isDeleted: false,
      }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approvePoem(id: string, moderatorId: string) {
    return this.poetryService.approve(id, moderatorId);
  }

  async rejectPoem(id: string, moderatorId: string, dto: RejectPoemDto) {
    return this.poetryService.reject(id, moderatorId, dto.reason);
  }

  async toggleFeatured(id: string) {
    return this.poetryService.toggleFeatured(id);
  }

  async listUsers(page: number = 1, limit: number = 20, filter?: string) {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    if (filter) {
      query.$or = [
        { username: { $regex: filter, $options: 'i' } },
        { email: { $regex: filter, $options: 'i' } },
        { 'profile.displayName': { $regex: filter, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash -refreshTokens')
        .lean(),
      this.userModel.countDocuments(query),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suspendUser(id: string, dto: SuspendUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.userModel.findByIdAndUpdate(id, {
      $set: {
        isSuspended: true,
        suspendedUntil: dto.until ? new Date(dto.until) : null,
        suspensionReason: dto.reason ?? '',
      },
    });
    return { message: 'User suspended' };
  }

  async getAnalyticsOverview() {
    const [
      totalUsers,
      totalPoems,
      pendingPoems,
      approvedPoems,
    ] = await Promise.all([
      this.userModel.countDocuments({ isActive: true }),
      this.poetryModel.countDocuments({ isDeleted: false }),
      this.poetryModel.countDocuments({
        status: PoetryStatus.PENDING,
        isDeleted: false,
      }),
      this.poetryModel.countDocuments({
        status: PoetryStatus.APPROVED,
        isDeleted: false,
      }),
    ]);

    return {
      totalUsers,
      totalPoems,
      pendingPoems,
      approvedPoems,
    };
  }
}
