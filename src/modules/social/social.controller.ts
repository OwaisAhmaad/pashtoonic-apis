import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SocialService } from './social.service';

@ApiTags('Social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ─── Likes ────────────────────────────────────────────────────────────────────

  @Post('poetry/:id/likes')
  @ApiOperation({ summary: 'Toggle like on a poem (idempotent)' })
  toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.socialService.toggleLike(id, user._id.toString());
  }

  @Public()
  @Get('poetry/:id/likes')
  @ApiOperation({ summary: 'Get like count and liked status for a poem' })
  getLikes(
    @Param('id') id: string,
    @CurrentUser() user?: { _id: string },
  ) {
    return this.socialService.getLikes(id, user?._id?.toString());
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  @Public()
  @Get('poetry/:id/comments')
  @ApiOperation({ summary: 'Get paginated comments (1-level nested)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getComments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getComments(id, page, limit);
  }

  @Post('poetry/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a poem' })
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateCommentDto,
  ) {
    return this.socialService.addComment(id, user._id.toString(), dto);
  }

  @Delete('poetry/:id/comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment (or admin/moderator)' })
  deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: { _id: string; roles: string[] },
  ) {
    return this.socialService.deleteComment(
      id,
      commentId,
      user._id.toString(),
      user.roles,
    );
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────────

  @Public()
  @Get('poetry/:id/reviews')
  @ApiOperation({ summary: 'Get paginated reviews with average rating' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getReviews(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getReviews(id, page, limit);
  }

  @Post('poetry/:id/reviews')
  @ApiOperation({ summary: 'Submit a review for a poem (one per user per poem)' })
  submitReview(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.socialService.submitReview(id, user._id.toString(), dto);
  }

  // ─── Follows ──────────────────────────────────────────────────────────────────

  @Post('users/:id/follow')
  @ApiOperation({ summary: 'Follow/unfollow a user (toggle)' })
  toggleFollow(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.socialService.toggleFollow(id, user._id.toString());
  }

  @Public()
  @Get('users/:id/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFollowers(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getFollowers(id, page, limit);
  }

  @Public()
  @Get('users/:id/following')
  @ApiOperation({ summary: 'Get users that a user follows' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFollowing(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.socialService.getFollowing(id, page, limit);
  }
}
