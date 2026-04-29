import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SuspendUserDto {
  @ApiPropertyOptional({ description: 'Suspension end date (ISO string). Omit for indefinite.' })
  @IsOptional()
  @IsDateString()
  until?: string;

  @ApiPropertyOptional({ example: 'Repeated violation of community guidelines' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
