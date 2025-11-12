import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, User, Course]),
  ],
  providers: [SchedulesService],
  controllers: [SchedulesController],
  exports: [SchedulesService],
})
export class SchedulesModule {}