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
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/schemas/user.schema';
import { CreatePoetDto } from './dto/create-poet.dto';
import { UpdatePoetDto } from './dto/update-poet.dto';
import { PoetsService } from './poets.service';

@ApiTags('Poets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1')
export class PoetsController {
  constructor(private readonly poetsService: PoetsService) {}

  @Post('poets')
  @ApiOperation({ summary: 'Create a poet profile for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Poet profile created' })
  create(
    @CurrentUser() user: { _id: string },
    @Body() dto: CreatePoetDto,
  ) {
    return this.poetsService.create(user._id.toString(), dto);
  }

  @Public()
  @Get('poets')
  @ApiOperation({ summary: 'List all verified poets' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listVerified(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.poetsService.listVerified(page, limit);
  }

  @Public()
  @Get('poets/:id')
  @ApiOperation({ summary: 'Get poet detail with portfolio' })
  @ApiResponse({ status: 200, description: 'Poet detail returned' })
  findById(@Param('id') id: string) {
    return this.poetsService.findById(id);
  }

  @Patch('poets/:id')
  @ApiOperation({ summary: 'Update own poet profile' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: UpdatePoetDto,
  ) {
    return this.poetsService.update(id, user._id.toString(), dto);
  }

  @Post('admin/poets/:id/verify')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify a poet (MODERATOR+)' })
  verify(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
  ) {
    return this.poetsService.verify(id, user._id.toString());
  }
}
