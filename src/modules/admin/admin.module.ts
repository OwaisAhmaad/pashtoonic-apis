import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Poetry, PoetrySchema } from '../../database/schemas/poetry.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { PoetryModule } from '../poetry/poetry.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Poetry.name, schema: PoetrySchema },
      { name: User.name, schema: UserSchema },
    ]),
    PoetryModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
