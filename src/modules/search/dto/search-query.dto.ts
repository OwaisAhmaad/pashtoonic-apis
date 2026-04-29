import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationDto } from '../../../common/dto/pagination.dto';
import { PoetryLanguage } from '../../../database/schemas/poetry.schema';

export enum SearchType {
  POETRY = 'poetry',
  POET = 'poet',
  USER = 'user',
}

export enum SearchSort {
  RELEVANCE = 'relevance',
  RECENT = 'recent',
  POPULAR = 'popular',
}

export class SearchQueryDto extends OffsetPaginationDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiPropertyOptional({ enum: SearchType })
  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;

  @ApiPropertyOptional({ enum: PoetryLanguage })
  @IsOptional()
  @IsEnum(PoetryLanguage)
  language?: PoetryLanguage;

  @ApiPropertyOptional({ enum: SearchSort, default: SearchSort.RELEVANCE })
  @IsOptional()
  @IsEnum(SearchSort)
  sort?: SearchSort = SearchSort.RELEVANCE;
}
