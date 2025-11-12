import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private termiiApiKey: string;
  private termiiSenderId: string;
  private brevoApiKey: string;
  private brevoSenderEmail: string;
  private brevoSenderName: string;

  constructor(private configService: ConfigService) {
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
}
