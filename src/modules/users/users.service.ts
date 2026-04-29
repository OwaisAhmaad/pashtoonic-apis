import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Poetry, PoetryDocument, PoetryStatus } from '../../database/schemas/poetry.schema';
import { User, UserDocument, UserRole } from '../../database/schemas/user.schema';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Poetry.name) private poetryModel: Model<PoetryDocument>,
  ) {}

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const updateData: Record<string, unknown> = {};
    if (dto.displayName !== undefined) updateData['profile.displayName'] = dto.displayName;
    if (dto.bio !== undefined) updateData['profile.bio'] = dto.bio;
    if (dto.avatarUrl !== undefined) updateData['profile.avatarUrl'] = dto.avatarUrl;

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getPublicProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('username profile stats level badges createdAt')
      .lean();
    if (!user || !user.isActive) throw new NotFoundException('User not found');
    return user;
  }

  async getUserPoetry(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.poetryModel
        .find({ authorId: new Types.ObjectId(userId), status: PoetryStatus.APPROVED, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.poetryModel.countDocuments({
        authorId: new Types.ObjectId(userId),
        status: PoetryStatus.APPROVED,
        isDeleted: false,
      }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async assignRole(targetUserId: string, dto: AssignRoleDto) {
    const user = await this.userModel
      .findByIdAndUpdate(
        targetUserId,
        { $addToSet: { roles: dto.role } },
        { new: true },
      )
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
