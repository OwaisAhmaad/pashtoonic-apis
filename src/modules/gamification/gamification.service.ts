import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LevelRule, LevelRuleDocument } from '../../database/schemas/level-rule.schema';
import { User, UserDocument, UserLevel } from '../../database/schemas/user.schema';

export enum XpAction {
  POEM_APPROVED = 'poem_approved',
  LIKE_RECEIVED = 'like_received',
  COMMENT_POSTED = 'comment_posted',
  REVIEW_SUBMITTED = 'review_submitted',
  FOLLOWER_GAINED = 'follower_gained',
}

const XP_VALUES: Record<XpAction, number> = {
  [XpAction.POEM_APPROVED]: 50,
  [XpAction.LIKE_RECEIVED]: 2,
  [XpAction.COMMENT_POSTED]: 5,
  [XpAction.REVIEW_SUBMITTED]: 10,
  [XpAction.FOLLOWER_GAINED]: 3,
};

const LEVEL_THRESHOLDS = [
  { name: UserLevel.NEWCOMER, minXp: 0, maxXp: 99, order: 1 },
  { name: UserLevel.EMERGING_VOICE, minXp: 100, maxXp: 499, order: 2 },
  { name: UserLevel.RISING_POET, minXp: 500, maxXp: 1999, order: 3 },
  { name: UserLevel.ESTABLISHED_POET, minXp: 2000, maxXp: 9999, order: 4 },
  { name: UserLevel.MASTER_POET, minXp: 10000, maxXp: Infinity, order: 5 },
];

const BADGE_CONDITIONS: Record<string, (user: UserDocument) => boolean> = {
  first_poem: (u) => (u.stats?.approvedPostCount ?? 0) >= 1,
  ten_likes: (u) => (u.stats?.totalLikesReceived ?? 0) >= 10,
  fifty_likes: (u) => (u.stats?.totalLikesReceived ?? 0) >= 50,
  first_comment: (u) => false, // tracked externally
  verified_poet: (u) => false, // handled by PoetsModule
};

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(LevelRule.name) private levelRuleModel: Model<LevelRuleDocument>,
  ) {}

  async awardXp(userId: string | Types.ObjectId, action: XpAction): Promise<void> {
    const xp = XP_VALUES[action];
    if (!xp) return;

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { 'stats.xp': xp } },
      { new: true },
    );
    if (!user) return;

    await this.recalculateLevel(user);
    await this.checkBadges(user);
  }

  async awardXpToAuthor(
    poetryAuthorId: string | Types.ObjectId,
    action: XpAction,
  ): Promise<void> {
    return this.awardXp(poetryAuthorId, action);
  }

  async getMyLevel(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('stats level')
      .lean();
    if (!user) return null;

    const xp = user.stats?.xp ?? 0;
    const currentThreshold = this.getLevelThreshold(xp);
    const nextThreshold = LEVEL_THRESHOLDS.find(
      (l) => l.order === currentThreshold.order + 1,
    );

    const progressPercent = nextThreshold
      ? Math.round(
          ((xp - currentThreshold.minXp) /
            (nextThreshold.minXp - currentThreshold.minXp)) *
            100,
        )
      : 100;

    return {
      currentLevel: currentThreshold.name,
      xp,
      progressPercent,
      nextLevel: nextThreshold?.name ?? null,
      xpToNextLevel: nextThreshold ? nextThreshold.minXp - xp : 0,
    };
  }

  async getMyBadges(userId: string) {
    const user = await this.userModel.findById(userId).select('badges').lean();
    return user?.badges ?? [];
  }

  async getLevelRules() {
    const rules = await this.levelRuleModel.find().sort({ order: 1 }).lean();
    if (rules.length > 0) return rules;
    return LEVEL_THRESHOLDS.map((t) => ({
      name: t.name,
      minXp: t.minXp,
      maxXp: t.maxXp === Infinity ? 999999 : t.maxXp,
      order: t.order,
      description: '',
    }));
  }

  async awardBadge(userId: string | Types.ObjectId, badgeName: string): Promise<void> {
    const user = await this.userModel.findById(userId).select('badges');
    if (!user) return;
    const hasBadge = user.badges.some((b) => b.name === badgeName);
    if (hasBadge) return;
    user.badges.push({ name: badgeName, earnedAt: new Date() });
    await user.save();
  }

  private async recalculateLevel(user: UserDocument): Promise<void> {
    const xp = user.stats?.xp ?? 0;
    const threshold = this.getLevelThreshold(xp);
    const nextThreshold = LEVEL_THRESHOLDS.find(
      (l) => l.order === threshold.order + 1,
    );
    const progressPercent = nextThreshold
      ? Math.round(
          ((xp - threshold.minXp) / (nextThreshold.minXp - threshold.minXp)) * 100,
        )
      : 100;

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          'level.currentLevel': threshold.name,
          'level.progressPercent': progressPercent,
        },
      },
    );
  }

  private getLevelThreshold(xp: number) {
    return (
      [...LEVEL_THRESHOLDS].reverse().find((l) => xp >= l.minXp) ??
      LEVEL_THRESHOLDS[0]
    );
  }

  private async checkBadges(user: UserDocument): Promise<void> {
    const hasBadge = (name: string) => user.badges?.some((b) => b.name === name);

    if (!hasBadge('first_poem') && (user.stats?.approvedPostCount ?? 0) >= 1) {
      await this.awardBadge(user._id as Types.ObjectId, 'first_poem');
    }
    if (!hasBadge('ten_likes') && (user.stats?.totalLikesReceived ?? 0) >= 10) {
      await this.awardBadge(user._id as Types.ObjectId, 'ten_likes');
    }
    if (!hasBadge('fifty_likes') && (user.stats?.totalLikesReceived ?? 0) >= 50) {
      await this.awardBadge(user._id as Types.ObjectId, 'fifty_likes');
    }
  }
}
