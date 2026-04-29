import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Poet, PoetDocument } from '../../database/schemas/poet.schema';
import { Poetry, PoetryDocument, PoetryStatus } from '../../database/schemas/poetry.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { SearchQueryDto, SearchSort, SearchType } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Poetry.name) private poetryModel: Model<PoetryDocument>,
    @InjectModel(Poet.name) private poetModel: Model<PoetDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async search(query: SearchQueryDto) {
    const { q, type, language, sort, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const results: Record<string, unknown> = {};

    if (!type || type === SearchType.POETRY) {
      const poetryFilter: Record<string, unknown> = {
        $text: { $search: q },
        status: PoetryStatus.APPROVED,
        isDeleted: false,
      };
      if (language) poetryFilter.language = language;

      let poetrySort: Record<string, SortOrder | { $meta: string }> = { score: { $meta: 'textScore' } };
      if (sort === SearchSort.RECENT) poetrySort = { createdAt: -1 };
      if (sort === SearchSort.POPULAR) poetrySort = { 'engagement.likeCount': -1 };

      const [poems, poemCount] = await Promise.all([
        this.poetryModel
          .find(poetryFilter, { score: { $meta: 'textScore' } })
          .sort(poetrySort)
          .skip(skip)
          .limit(limit)
          .populate('authorId', 'username profile.displayName')
          .lean(),
        this.poetryModel.countDocuments(poetryFilter),
      ]);
      results.poetry = { items: poems, total: poemCount };
    }

    if (!type || type === SearchType.POET) {
      const poets = await this.poetModel
        .find({
          $or: [
            { displayName: { $regex: q, $options: 'i' } },
            { bio: { $regex: q, $options: 'i' } },
          ],
          isVerified: true,
          isActive: true,
        })
        .skip(skip)
        .limit(limit)
        .lean();
      const poetCount = await this.poetModel.countDocuments({
        $or: [
          { displayName: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } },
        ],
        isVerified: true,
        isActive: true,
      });
      results.poets = { items: poets, total: poetCount };
    }

    if (!type || type === SearchType.USER) {
      const users = await this.userModel
        .find({
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { 'profile.displayName': { $regex: q, $options: 'i' } },
          ],
          isActive: true,
        })
        .select('username profile stats level')
        .skip(skip)
        .limit(limit)
        .lean();
      const userCount = await this.userModel.countDocuments({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { 'profile.displayName': { $regex: q, $options: 'i' } },
        ],
        isActive: true,
      });
      results.users = { items: users, total: userCount };
    }

    return results;
  }
}
