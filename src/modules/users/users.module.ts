import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Poetry, PoetrySchema } from '../../database/schemas/poetry.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Poetry.name, schema: PoetrySchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
