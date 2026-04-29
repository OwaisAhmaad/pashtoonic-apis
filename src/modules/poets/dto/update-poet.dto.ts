import { PartialType } from '@nestjs/swagger';
import { CreatePoetDto } from './create-poet.dto';

export class UpdatePoetDto extends PartialType(CreatePoetDto) {}
