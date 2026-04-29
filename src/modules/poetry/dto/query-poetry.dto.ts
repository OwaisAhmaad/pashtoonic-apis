import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../../../common/dto/pagination.dto';
import { PoetryLanguage, PoetryType } from '../../../database/schemas/poetry.schema';

export enum PoetrySortOption {
  RECENT = 'recent',
  POPULAR = 'popular',
  TRENDING = 'trending',
}

export class QueryPoetryDto extends CursorPaginationDto {
  @ApiPropertyOptional({ enum: PoetryLanguage })
  @IsOptional()
  @IsEnum(PoetryLanguage)
  language?: PoetryLanguage;

  @ApiPropertyOptional({ enum: PoetryType })
  @IsOptional()
  @IsEnum(PoetryType)
  type?: PoetryType;

  @ApiPropertyOptional({ enum: PoetrySortOption, default: PoetrySortOption.RECENT })
  @IsOptional()
  @IsEnum(PoetrySortOption)
  sort?: PoetrySortOption = PoetrySortOption.RECENT;
}
