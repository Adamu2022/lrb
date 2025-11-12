import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { EncryptionService } from './encryption.service';
import { NotificationSettings } from '../entities/notification-settings.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([NotificationSettings]),
  ],
  providers: [NotificationsService, EncryptionService],
  exports: [NotificationsService],
})
export class NotificationsModule {}