import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Schedule } from '../entities/schedule.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Reminder } from '../entities/reminder.entity';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import { ReminderLog } from '../entities/reminder-log.entity';
import { AuditLog } from '../entities/audit-log.entity';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '08080397908',
  database: process.env.DB_NAME || 'lecture_reminder',
  entities: [
    User,
    Schedule,
    Course,
    Enrollment,
    Reminder,
    NotificationSettings,
    NotificationLog,
    ReminderLog,
    AuditLog,
  ],
  synchronize: true, // Set to false in production
  logging: false,
};