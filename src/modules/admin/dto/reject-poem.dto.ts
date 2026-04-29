import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPoemDto {
  @ApiProperty({ example: 'Content violates community guidelines' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
