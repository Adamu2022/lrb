import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsController } from './notifications-settings.controller';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EncryptionService } from './encryption.service';
import { NotificationSettingsValidationPipe } from './notification-validation.pipe';
import { NotificationExceptionFilter } from './notification-exception.filter';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSettings, NotificationLog, AuditLog]),
  ],
  controllers: [NotificationSettingsController],
  providers: [NotificationsService, EncryptionService, NotificationSettingsValidationPipe, NotificationExceptionFilter],
  exports: [NotificationsService, EncryptionService],
})
export class NotificationsModule {}