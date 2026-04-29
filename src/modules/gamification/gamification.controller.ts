import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { GamificationService } from './gamification.service';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('users/me/level')
  @ApiOperation({ summary: 'Get current user level, XP, and progress' })
  @ApiResponse({ status: 200, description: 'Level info returned' })
  getMyLevel(@CurrentUser() user: { _id: string }) {
    return this.gamificationService.getMyLevel(user._id.toString());
  }

  @Get('users/me/badges')
  @ApiOperation({ summary: 'Get earned badges for current user' })
  @ApiResponse({ status: 200, description: 'Badges returned' })
  getMyBadges(@CurrentUser() user: { _id: string }) {
    return this.gamificationService.getMyBadges(user._id.toString());
  }

  @Public()
  @Get('level-rules')
  @ApiOperation({ summary: 'Get all level definitions and XP thresholds' })
  @ApiResponse({ status: 200, description: 'Level rules returned' })
  getLevelRules() {
    return this.gamificationService.getLevelRules();
  }
}
