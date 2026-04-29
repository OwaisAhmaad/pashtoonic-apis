import {
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePoetryDto } from './dto/create-poetry.dto';
import { QueryPoetryDto } from './dto/query-poetry.dto';
import { UpdatePoetryDto } from './dto/update-poetry.dto';
import { PoetryService } from './poetry.service';

@ApiTags('Poetry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/poetry')
export class PoetryController {
  constructor(private readonly poetryService: PoetryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved poems (cursor paginated)' })
  @ApiResponse({ status: 200, description: 'Poems listed' })
  list(@Query() query: QueryPoetryDto) {
    return this.poetryService.list(query);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured poems' })
  getFeatured(@Query('limit') limit?: number) {
    return this.poetryService.getFeatured(limit);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Get trending poems by engagement score' })
  getTrending(@Query('limit') limit?: number) {
    return this.poetryService.getTrending(limit);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Full-text search on title, content, and tags' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  search(
    @Query('q') q: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.poetryService.search(q, page, limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single poem by ID' })
  @ApiResponse({ status: 200, description: 'Poem returned' })
  @ApiResponse({ status: 404, description: 'Poem not found' })
  findById(@Param('id') id: string) {
    return this.poetryService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new poem (goes to moderation queue)' })
  @ApiResponse({ status: 201, description: 'Poem submitted for moderation' })
  create(
    @CurrentUser() user: { _id: string },
    @Body() dto: CreatePoetryDto,
  ) {
    return this.poetryService.create(user._id.toString(), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own poem' })
  @ApiResponse({ status: 200, description: 'Poem updated' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: UpdatePoetryDto,
  ) {
    return this.poetryService.update(id, user._id.toString(), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete poem (owner or admin/moderator)' })
  @ApiResponse({ status: 200, description: 'Poem deleted' })
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { _id: string; roles: string[] },
  ) {
    return this.poetryService.softDelete(id, user._id.toString(), user.roles);
  }
}
