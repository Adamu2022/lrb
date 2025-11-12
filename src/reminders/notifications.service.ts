import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { EncryptionService } from './encryption.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private termiiApiKey: string;
  private termiiSenderId: string;
  private brevoApiKey: string;
  private brevoSenderEmail: string;
  private brevoSenderName: string;

  constructor(
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    @InjectRepository(NotificationSettings)
    private notificationSettingsRepository: Repository<NotificationSettings>,
  ) {
    this.termiiApiKey = this.configService.get<string>('TERMII_API_KEY')!;
    this.termiiSenderId = this.configService.get<string>('TERMII_SENDER_ID')!;
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY')!;
    this.brevoSenderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL')!;
    this.brevoSenderName = this.configService.get<string>('BREVO_SENDER_NAME')!;
  }

  async sendSMSReminder(phoneNumber: string, message: string): Promise<void> {
    try {
      const url = 'https://api.ng.termii.com/api/sms/send';
      const payload = {
        to: phoneNumber,
        from: this.termiiSenderId,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: this.termiiApiKey,
      };

      const { data } = await axios.post(url, payload);
      this.logger.log(`✅ SMS sent to ${phoneNumber}: ${JSON.stringify(data)}`);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send SMS to ${phoneNumber}: ${error?.message ?? error}`,
      );
    }
  }

  async sendEmailReminder(
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    try {
      const url = 'https://api.brevo.com/v3/smtp/email';
      const payload = {
        sender: { email: this.brevoSenderEmail, name: this.brevoSenderName },
        to: [{ email }],
        subject,
        htmlContent: `<p>${message}</p>`,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'api-key': this.brevoApiKey,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ Email sent to ${email}: ${response.status}`);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send Email to ${email}: ${error?.message ?? error}`,
      );
    }
  }

  async sendReminder(
    user: { email: string; phoneNumber: string },
    subject: string,
    message: string,
  ) {
    await Promise.all([
      this.sendSMSReminder(user.phoneNumber, message),
      this.sendEmailReminder(user.email, subject, message),
    ]);
  }

  // Add missing methods that the controller expects
  async getNotificationSettings(
    ownerType: 'organization' | 'user',
    ownerId: number,
  ): Promise<NotificationSettings | null> {
    return this.notificationSettingsRepository.findOne({
      where: { ownerType, ownerId },
    });
  }

  async updateNotificationSettings(
    updateDto: any,
    userId: number,
  ): Promise<NotificationSettings> {
    let settings = await this.getNotificationSettings(
      updateDto.owner_type,
      updateDto.owner_id,
    );

    if (!settings) {
      settings = new NotificationSettings();
      settings.ownerType = updateDto.owner_type;
      settings.ownerId = updateDto.owner_id;
    }

    settings.channels = updateDto.channels;
    settings.email_config = updateDto.email_config;
    settings.sms_config = updateDto.sms_config;
    settings.push_config = updateDto.push_config;
    settings.calendar_config = updateDto.calendar_config;

    // Encrypt sensitive data
    if (settings.email_config?.encrypted_password) {
      settings.email_config.encrypted_password = this.encryptionService.encrypt(
        settings.email_config.encrypted_password,
      );
    }

    if (settings.sms_config?.encrypted_twilio_token) {
      settings.sms_config.encrypted_twilio_token =
        this.encryptionService.encrypt(
          settings.sms_config.encrypted_twilio_token,
        );
    }

    return this.notificationSettingsRepository.save(settings);
  }

  getMaskedSettings(settings: NotificationSettings): any {
    const masked = { ...settings };

    // Mask sensitive data
    if (masked.email_config?.encrypted_password) {
      masked.email_config.encrypted_password =
        this.encryptionService.maskSensitiveData(
          masked.email_config.encrypted_password,
        );
    }

    if (masked.sms_config?.encrypted_twilio_token) {
      masked.sms_config.encrypted_twilio_token =
        this.encryptionService.maskSensitiveData(
          masked.sms_config.encrypted_twilio_token,
        );
    }

    return masked;
  }

  async testNotification(
    provider: string,
    config: any,
    testRecipient: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (provider) {
        case 'email':
          await this.sendEmailReminder(
            testRecipient,
            'Test Notification',
            'This is a test notification from the Lecture Reminder System.',
          );
          return { success: true, message: 'Test email sent successfully' };

        case 'sms':
          await this.sendSMSReminder(
            testRecipient,
            'This is a test SMS from the Lecture Reminder System.',
          );
          return { success: true, message: 'Test SMS sent successfully' };

        default:
          return {
            success: false,
            message: `Unsupported provider: ${provider}`,
          };
      }
    } catch (error) {
      this.logger.error(`Test notification failed: ${error.message}`);
      return { success: false, message: `Test failed: ${error.message}` };
    }
  }

  async sendNotification(
    userId: number,
    scheduleId: number,
    channels: string[],
    payload: Record<string, any>,
  ): Promise<void> {
    // This is a simplified implementation
    // In a real system, you would fetch user details and send notifications based on channels
    this.logger.log(
      `Sending notification to user ${userId} for schedule ${scheduleId} via channels: ${channels.join(
        ', ',
      )}`,
    );

    // For now, we'll just log the payload
    this.logger.log(`Notification payload: ${JSON.stringify(payload)}`);
  }
}
