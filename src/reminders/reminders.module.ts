import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { NotificationsService } from './notifications.service';
import { EncryptionService } from './encryption.service';
import { NetworkDiagnosticsService } from './network-diagnostics.service';
import { Reminder } from '../entities/reminder.entity';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../entities/user.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reminder,
      Schedule,
      User,
      Enrollment,
      NotificationSettings,
      NotificationLog,
      AuditLog,
    ]),
  ],
  providers: [
    RemindersService,
    ReminderSchedulerService,
    NotificationsService,
    EncryptionService,
    NetworkDiagnosticsService,
  ],
  controllers: [RemindersController],
  exports: [RemindersService, ReminderSchedulerService, NotificationsService],
})
export class RemindersModule {}
