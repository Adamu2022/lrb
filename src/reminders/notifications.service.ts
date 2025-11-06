import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EncryptionService } from './encryption.service';
import { NetworkDiagnosticsService } from './network-diagnostics.service';
import { UpdateNotificationSettingsDto } from '../dtos/notification.dto';
import * as nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationSettings)
    private notificationSettingsRepository: Repository<NotificationSettings>,
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private encryptionService: EncryptionService,
    private networkDiagnosticsService: NetworkDiagnosticsService,
  ) {}

  // Get notification settings for an owner (organization or user)
  async getNotificationSettings(ownerType: 'organization' | 'user', ownerId: number): Promise<NotificationSettings | null> {
    return this.notificationSettingsRepository.findOne({
      where: { ownerType, ownerId },
    });
  }

  // Create or update notification settings
  async updateNotificationSettings(settingsDto: UpdateNotificationSettingsDto, userId: number): Promise<NotificationSettings> {
    // Create a copy of the settings to work with
    const settings: Partial<NotificationSettings> = {
      ownerType: settingsDto.owner_type,
      ownerId: settingsDto.owner_id,
      channels: settingsDto.channels,
      email_config: settingsDto.email_config ? {
        provider: settingsDto.email_config.provider,
        smtp_host: settingsDto.email_config.smtp_host,
        smtp_port: settingsDto.email_config.smtp_port,
        username: settingsDto.email_config.username,
        from_name: settingsDto.email_config.from_name,
        from_email: settingsDto.email_config.from_email,
      } : undefined,
      sms_config: settingsDto.sms_config ? {
        twilio_sid: settingsDto.sms_config.twilio_sid,
        phone_number: settingsDto.sms_config.phone_number,
      } : undefined,
      push_config: settingsDto.push_config ? {} : undefined,
      calendar_config: settingsDto.calendar_config ? {
        google_client_id: settingsDto.calendar_config.google_client_id,
        redirect_uri: settingsDto.calendar_config.redirect_uri,
      } : undefined,
    };

    // Encrypt sensitive data before saving
    if (settings.email_config && (settings.email_config as any).password) {
      settings.email_config.encrypted_password = this.encryptionService.encrypt((settings.email_config as any).password);
      delete (settings.email_config as any).password;
    }

    if (settings.sms_config && (settings.sms_config as any).twilio_token) {
      settings.sms_config.encrypted_twilio_token = this.encryptionService.encrypt((settings.sms_config as any).twilio_token);
      delete (settings.sms_config as any).twilio_token;
    }

    if (settings.push_config && (settings.push_config as any).firebase_service_account_json) {
      settings.push_config.firebase_service_account_json_encrypted = 
        this.encryptionService.encrypt((settings.push_config as any).firebase_service_account_json);
      delete (settings.push_config as any).firebase_service_account_json;
    }

    if (settings.calendar_config && (settings.calendar_config as any).google_client_secret) {
      settings.calendar_config.google_client_secret_encrypted = 
        this.encryptionService.encrypt((settings.calendar_config as any).google_client_secret);
      delete (settings.calendar_config as any).google_client_secret;
    }

    if (settings.calendar_config && (settings.calendar_config as any).refresh_token) {
      settings.calendar_config.refresh_token_encrypted = 
        this.encryptionService.encrypt((settings.calendar_config as any).refresh_token);
      delete (settings.calendar_config as any).refresh_token;
    }

    if (!settings.ownerType || settings.ownerId === undefined) {
      throw new Error('Owner type and owner ID are required');
    }
    const existingSettings = await this.getNotificationSettings(settings.ownerType, settings.ownerId);
    
    if (existingSettings) {
      // Log the changes for audit purposes
      const changes = this.getChanges(existingSettings, settings);
      if (Object.keys(changes).length > 0) {
        await this.logAudit('UPDATE', 'NotificationSettings', existingSettings.id, changes, userId);
      }
      
      Object.assign(existingSettings, settings);
      return this.notificationSettingsRepository.save(existingSettings);
    } else {
      const newSettings = this.notificationSettingsRepository.create(settings);
      const savedSettings = await this.notificationSettingsRepository.save(newSettings);
      // Log the creation for audit purposes
      await this.logAudit('CREATE', 'NotificationSettings', savedSettings.id, settings, userId);
      return savedSettings;
    }
  }

  // Helper method to get changes between two objects
  private getChanges(oldObj: any, newObj: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    // Compare top-level properties
    for (const key in newObj) {
      if (newObj.hasOwnProperty(key) && oldObj[key] !== newObj[key]) {
        // For config objects, we need to compare their properties
        if (typeof newObj[key] === 'object' && newObj[key] !== null && 
            typeof oldObj[key] === 'object' && oldObj[key] !== null) {
          const configChanges: Record<string, any> = {};
          for (const configKey in newObj[key]) {
            if (newObj[key].hasOwnProperty(configKey) && oldObj[key][configKey] !== newObj[key][configKey]) {
              // Don't log sensitive data in audit logs
              if (!configKey.includes('password') && 
                  !configKey.includes('token') && 
                  !configKey.includes('secret') && 
                  !configKey.includes('refresh')) {
                configChanges[configKey] = {
                  from: oldObj[key][configKey],
                  to: newObj[key][configKey]
                };
              } else {
                configChanges[configKey] = {
                  from: '**REDACTED**',
                  to: '**REDACTED**'
                };
              }
            }
          }
          if (Object.keys(configChanges).length > 0) {
            changes[key] = configChanges;
          }
        } else {
          // Don't log sensitive data in audit logs
          if (!key.includes('password') && 
              !key.includes('token') && 
              !key.includes('secret') && 
              !key.includes('refresh')) {
            changes[key] = {
              from: oldObj[key],
              to: newObj[key]
            };
          } else {
            changes[key] = {
              from: '**REDACTED**',
              to: '**REDACTED**'
            };
          }
        }
      }
    }
    
    return changes;
  }

  // Log audit entry
  private async logAudit(
    action: 'CREATE' | 'UPDATE' | 'DELETE', 
    entityType: string, 
    entityId: number, 
    changes: Record<string, any>,
    userId: number
  ): Promise<void> {
    try {
      const auditLog = new AuditLog();
      auditLog.userId = userId;
      auditLog.action = action;
      auditLog.entityType = entityType;
      auditLog.entityId = entityId;
      auditLog.changes = changes;
      
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to log audit entry: ${error.message}`);
    }
  }

  // Get masked settings for API responses
  getMaskedSettings(settings: NotificationSettings): any {
    if (!settings) return null;

    const maskedSettings = { ...settings };

    // Mask sensitive data
    if (maskedSettings.email_config && maskedSettings.email_config.encrypted_password) {
      maskedSettings.email_config.encrypted_password = 
        this.encryptionService.maskSensitiveData(maskedSettings.email_config.encrypted_password);
    }

    if (maskedSettings.sms_config && maskedSettings.sms_config.encrypted_twilio_token) {
      maskedSettings.sms_config.encrypted_twilio_token = 
        this.encryptionService.maskSensitiveData(maskedSettings.sms_config.encrypted_twilio_token);
    }

    if (maskedSettings.push_config && maskedSettings.push_config.firebase_service_account_json_encrypted) {
      maskedSettings.push_config.firebase_service_account_json_encrypted = 
        this.encryptionService.maskSensitiveData(maskedSettings.push_config.firebase_service_account_json_encrypted);
    }

    if (maskedSettings.calendar_config && maskedSettings.calendar_config.google_client_secret_encrypted) {
      maskedSettings.calendar_config.google_client_secret_encrypted = 
        this.encryptionService.maskSensitiveData(maskedSettings.calendar_config.google_client_secret_encrypted);
    }

    if (maskedSettings.calendar_config && maskedSettings.calendar_config.refresh_token_encrypted) {
      maskedSettings.calendar_config.refresh_token_encrypted = 
        this.encryptionService.maskSensitiveData(maskedSettings.calendar_config.refresh_token_encrypted);
    }

    return maskedSettings;
  }

  // Test notification sending
  async testNotification(provider: string, testConfig: any, testTo?: string): Promise<{ success: boolean; message: string }> {
    try {
      switch (provider) {
        case 'email':
          return await this.testEmail(testConfig, testTo);
        case 'sms':
          return await this.testSms(testConfig, testTo);
        case 'push':
          return await this.testPush(testConfig, testTo);
        case 'calendar':
          return await this.testCalendar(testConfig);
        default:
          return { success: false, message: 'Unsupported provider' };
      }
    } catch (error) {
      this.logger.error(`Test notification failed for ${provider}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  private async testEmail(config: any, testEmail?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decrypt password if needed
      let password = config.password;
      if (config.encrypted_password) {
        password = this.encryptionService.decrypt(config.encrypted_password);
      }

      // Create transporter based on provider
      let transporter;
      if (config.provider === 'gmail') {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.username || config.from_email,
            pass: password,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: config.smtp_host,
          port: config.smtp_port,
          secure: config.smtp_port === 465,
          auth: {
            user: config.username,
            pass: password,
          },
        });
      }

      const mailOptions = {
        from: config.from_email,
        to: testEmail || config.from_email,
        subject: 'Test Email from Lecture Reminder System',
        text: 'This is a test email to confirm your email configuration is working correctly.',
      };

      // Verify connection configuration
      await transporter.verify();
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Test email sent successfully!' };
    } catch (error) {
      let errorMessage = `Failed to send test email: ${error.message}`;
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused. Please check your SMTP server settings and network connectivity.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'SMTP server not found. Please check your SMTP host setting.';
      } else if (error.code === 'ECONNRESET') {
        errorMessage = 'Connection reset by peer. Please check your network connection.';
      } else if (error.responseCode) {
        errorMessage = `SMTP server responded with error code ${error.responseCode}: ${error.message}`;
      }
      return { success: false, message: errorMessage };
    }
  }

  private async testSms(config: any, testTo?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decrypt token if needed
      let authToken = config.twilio_token;
      if (config.encrypted_twilio_token) {
        authToken = this.encryptionService.decrypt(config.encrypted_twilio_token);
      }

      const client = new Twilio(config.twilio_sid, authToken);
      await client.messages.create({
        body: 'This is a test SMS from the Lecture Reminder System.',
        from: config.phone_number,
        to: testTo || '',
      });

      return { success: true, message: 'Test SMS sent successfully!' };
    } catch (error) {
      let errorMessage = `Failed to send test SMS: ${error.message}`;
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your Twilio credentials.';
      } else if (error.status === 403) {
        errorMessage = 'Insufficient permissions. Please check your Twilio account permissions.';
      } else if (error.status >= 500) {
        errorMessage = 'Twilio server error. Please try again later.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to connect to Twilio API. Please check your network connection.';
      }
      return { success: false, message: errorMessage };
    }
  }

  private async testPush(config: any, testDeviceToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Decrypt service account JSON if needed
      let serviceAccountJson = config.firebase_service_account_json;
      if (config.firebase_service_account_json_encrypted) {
        serviceAccountJson = this.encryptionService.decrypt(config.firebase_service_account_json_encrypted);
      }

      // Initialize Firebase Admin SDK if not already initialized
      if (!admin.apps.length && serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      await admin.messaging().send({
        token: testDeviceToken || '',
        notification: {
          title: 'Test Notification',
          body: 'This is a test push notification from the Lecture Reminder System.',
        },
      });

      return { success: true, message: 'Test push notification sent successfully!' };
    } catch (error) {
      let errorMessage = `Failed to send test push notification: ${error.message}`;
      if (error.code === 'invalid-argument') {
        errorMessage = 'Invalid device token. Please check the device token.';
      } else if (error.code === 'authentication-error') {
        errorMessage = 'Authentication failed. Please check your Firebase service account credentials.';
      } else if (error.code === 'unregistered') {
        errorMessage = 'Device token is unregistered. Please check the device token.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to connect to Firebase. Please check your network connection.';
      }
      return { success: false, message: errorMessage };
    }
  }

  private async testCalendar(config: any): Promise<{ success: boolean; message: string }> {
    try {
      // Decrypt secrets if needed
      let clientSecret = config.google_client_secret;
      if (config.google_client_secret_encrypted) {
        clientSecret = this.encryptionService.decrypt(config.google_client_secret_encrypted);
      }

      let refreshToken = config.refresh_token;
      if (config.refresh_token_encrypted) {
        refreshToken = this.encryptionService.decrypt(config.refresh_token_encrypted);
      }

      const oauth2Client = new google.auth.OAuth2(
        config.google_client_id,
        clientSecret,
        config.redirect_uri,
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: 'Test Event - Lecture Reminder System',
        description: 'This is a test event to confirm your Google Calendar integration is working correctly.',
        start: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return { success: true, message: 'Test calendar event created successfully!' };
    } catch (error) {
      let errorMessage = `Failed to create test calendar event: ${error.message}`;
      if (error.code === 401) {
        errorMessage = 'Authentication failed. Please check your Google Calendar credentials.';
      } else if (error.code === 403) {
        errorMessage = 'Insufficient permissions. Please check your Google Calendar permissions.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to connect to Google Calendar API. Please check your network connection.';
      } else if (error.message.includes('invalid_grant')) {
        errorMessage = 'Invalid grant. Your refresh token may have expired. Please re-authorize the application.';
      }
      return { success: false, message: errorMessage };
    }
  }

  // Send notification through specified channels
  async sendNotification(
    userId: number,
    scheduleId: number,
    channels: string[],
    payload: Record<string, any>
  ): Promise<void> {
    // Get user's notification settings
    const settings = await this.getNotificationSettings('user', userId);
    
    if (!settings) {
      this.logger.warn(`No notification settings found for user ${userId}`);
      return;
    }

    // Create log entry for each channel
    const logEntries: NotificationLog[] = [];
    for (const channel of channels) {
      if (settings.channels[channel]) {
        const logEntry = new NotificationLog();
        logEntry.userId = userId;
        logEntry.scheduleId = scheduleId;
        logEntry.channel = channel;
        logEntry.status = 'pending';
        logEntry.attempts = 0;
        logEntries.push(logEntry);
      }
    }

    if (logEntries.length > 0) {
      await this.notificationLogRepository.save(logEntries);
    }

    // Send notifications for each enabled channel
    for (const channel of channels) {
      if (settings.channels[channel]) {
        try {
          await this.sendThroughChannel(channel, settings, userId, scheduleId, payload);
          
          // Update log entry as successful
          await this.notificationLogRepository.update(
            { userId, scheduleId, channel },
            { 
              status: 'sent', 
              attempts: 1, 
              lastAttemptAt: new Date(),
              providerResponse: 'Success'
            }
          );
        } catch (error) {
          this.logger.error(`Failed to send ${channel} notification to user ${userId}: ${error.message}`);
          
          // Update log entry as failed
          await this.notificationLogRepository.update(
            { userId, scheduleId, channel },
            { 
              status: 'failed', 
              attempts: 1, 
              lastAttemptAt: new Date(),
              providerResponse: error.message
            }
          );
        }
      }
    }
  }

  private async sendThroughChannel(
    channel: string,
    settings: NotificationSettings,
    userId: number,
    scheduleId: number,
    payload: Record<string, any>
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(settings, payload);
        break;
      case 'sms':
        await this.sendSms(settings, payload);
        break;
      case 'push':
        await this.sendPush(settings, payload);
        break;
      case 'calendar':
        await this.sendCalendarEvent(settings, payload);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async sendEmail(settings: NotificationSettings, payload: Record<string, any>): Promise<void> {
    if (!settings.email_config) {
      throw new Error('Email configuration not found');
    }

    try {
      // Decrypt password if needed
      let password = settings.email_config.encrypted_password;
      if (password) {
        password = this.encryptionService.decrypt(password);
      }

      // Create transporter based on provider
      let transporter;
      if (settings.email_config.provider === 'gmail') {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: settings.email_config.username || settings.email_config.from_email,
            pass: password,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: settings.email_config.smtp_host,
          port: settings.email_config.smtp_port,
          secure: settings.email_config.smtp_port === 465,
          auth: {
            user: settings.email_config.username,
            pass: password,
          },
        });
      }

      // Create email template with payload variables
      const subject = `Lecture Reminder: ${payload.courseTitle}`;
      const text = `Dear ${payload.userName},

This is a reminder that you have a lecture for ${payload.courseTitle} (${payload.courseCode}) 
on ${payload.date} at ${payload.time} in ${payload.venue}.

Please ensure you're prepared and arrive on time.

Best regards,
Lecture Reminder System`;

      const mailOptions = {
        from: settings.email_config.from_email,
        to: payload.userEmail,
        subject,
        text,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private async sendSms(settings: NotificationSettings, payload: Record<string, any>): Promise<void> {
    if (!settings.sms_config) {
      throw new Error('SMS configuration not found');
    }

    try {
      // Decrypt token if needed
      let authToken = settings.sms_config.encrypted_twilio_token;
      if (authToken) {
        authToken = this.encryptionService.decrypt(authToken);
      }

      const client = new Twilio(settings.sms_config.twilio_sid, authToken);
      
      // Create SMS template with payload variables
      const message = `Lecture Reminder: ${payload.courseTitle} (${payload.courseCode}) 
on ${payload.date} at ${payload.time} in ${payload.venue}.`;

      await client.messages.create({
        body: message,
        from: settings.sms_config.phone_number,
        to: payload.userPhone,
      });
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  private async sendPush(settings: NotificationSettings, payload: Record<string, any>): Promise<void> {
    if (!settings.push_config) {
      throw new Error('Push notification configuration not found');
    }

    try {
      // Decrypt service account JSON if needed
      let serviceAccountJson = settings.push_config.firebase_service_account_json_encrypted;
      if (serviceAccountJson) {
        serviceAccountJson = this.encryptionService.decrypt(serviceAccountJson);
      }

      // Initialize Firebase Admin SDK if not already initialized
      if (!admin.apps.length && serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      // Create push notification template with payload variables
      const message = {
        token: payload.deviceToken,
        notification: {
          title: 'Lecture Reminder',
          body: `${payload.courseTitle} on ${payload.date} at ${payload.time}`,
        },
        data: {
          courseId: payload.courseId?.toString() || '',
          scheduleId: payload.scheduleId?.toString() || '',
        },
      };

      await admin.messaging().send(message);
    } catch (error) {
      throw new Error(`Failed to send push notification: ${error.message}`);
    }
  }

  private async sendCalendarEvent(settings: NotificationSettings, payload: Record<string, any>): Promise<void> {
    if (!settings.calendar_config) {
      throw new Error('Calendar configuration not found');
    }

    try {
      // Decrypt secrets if needed
      let clientSecret = settings.calendar_config.google_client_secret_encrypted;
      if (clientSecret) {
        clientSecret = this.encryptionService.decrypt(clientSecret);
      }

      let refreshToken = settings.calendar_config.refresh_token_encrypted;
      if (refreshToken) {
        refreshToken = this.encryptionService.decrypt(refreshToken);
      }

      const oauth2Client = new google.auth.OAuth2(
        settings.calendar_config.google_client_id,
        clientSecret,
        settings.calendar_config.redirect_uri,
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Create calendar event template with payload variables
      const event = {
        summary: `Lecture: ${payload.courseTitle}`,
        description: `Lecture for ${payload.courseTitle} (${payload.courseCode})
Location: ${payload.venue}
Instructor: ${payload.instructorName}`,
        start: {
          dateTime: new Date(`${payload.date}T${payload.time}`).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(new Date(`${payload.date}T${payload.time}`).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: payload.venue,
      };

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  // Get notification logs for a user
  async getNotificationLogs(userId: number): Promise<NotificationLog[]> {
    return this.notificationLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Get audit logs for a user
  async getAuditLogs(userId: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}