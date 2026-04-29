import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/schemas/user.schema';
import { AdminService } from './admin.service';
import { RejectPoemDto } from './dto/reject-poem.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('moderation/queue')
  @ApiOperation({ summary: 'Get pending poems queue (MODERATOR+)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getModerationQueue(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getModerationQueue(page, limit);
  }

  @Post('moderation/:id/approve')
  @ApiOperation({ summary: 'Approve a pending poem (MODERATOR+)' })
  approvePoem(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.adminService.approvePoem(id, user._id.toString());
  }

  @Post('moderation/:id/reject')
  @ApiOperation({ summary: 'Reject a pending poem with reason (MODERATOR+)' })
  rejectPoem(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: RejectPoemDto,
  ) {
    return this.adminService.rejectPoem(id, user._id.toString(), dto);
  }

  @Post('poetry/:id/feature')
  @ApiOperation({ summary: 'Toggle featured status of a poem (MODERATOR+)' })
  toggleFeatured(@Param('id') id: string) {
    return this.adminService.toggleFeatured(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated, filterable) (MODERATOR+)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'filter', required: false, description: 'Search by username/email/displayName' })
  listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('filter') filter?: string,
  ) {
    return this.adminService.listUsers(page, limit, filter);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user (MODERATOR+)' })
  suspendUser(@Param('id') id: string, @Body() dto: SuspendUserDto) {
    return this.adminService.suspendUser(id, dto);
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get platform analytics overview (MODERATOR+)' })
  getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }
}
