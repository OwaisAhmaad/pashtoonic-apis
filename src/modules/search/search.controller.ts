import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Faceted search across poetry, poets, and users',
    description:
      'Full-text search on poetry (title, content, tags) and regex search on poets/users. Supports type filtering, language filtering, and sorting.',
  })
  @ApiResponse({ status: 200, description: 'Search results with facet counts' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
