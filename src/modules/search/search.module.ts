import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Poet, PoetSchema } from '../../database/schemas/poet.schema';
import { Poetry, PoetrySchema } from '../../database/schemas/poetry.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Poetry.name, schema: PoetrySchema },
      { name: Poet.name, schema: PoetSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
