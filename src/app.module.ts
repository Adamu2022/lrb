import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SchedulesModule } from './schedules/schedules.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './reminders/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    AuthModule,
    SchedulesModule,
    CoursesModule,
    EnrollmentsModule,
    RemindersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}