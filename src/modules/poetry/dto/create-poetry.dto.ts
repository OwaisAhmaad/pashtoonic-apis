import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PoetryLanguage, PoetryType } from '../../../database/schemas/poetry.schema';

export class CreatePoetryDto {
  @ApiProperty({ example: 'د زړه آواز' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'د زړه له کومي درته وايم...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiProperty({ enum: PoetryLanguage, default: PoetryLanguage.PS })
  @IsEnum(PoetryLanguage)
  language: PoetryLanguage;

  @ApiProperty({ enum: PoetryType, default: PoetryType.OTHER })
  @IsEnum(PoetryType)
  type: PoetryType;

  @ApiPropertyOptional({ type: [String], example: ['love', 'homeland'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  audioUrl?: string;
}
