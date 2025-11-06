import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

// Define interfaces for configuration objects
export interface NotificationChannels {
  email: boolean;
  sms: boolean;
  push: boolean;
  calendar: boolean;
}

export interface EmailConfig {
  provider: string; // gmail, smtp, sendgrid, custom
  smtp_host?: string;
  smtp_port?: number;
  username?: string;
  encrypted_password?: string;
  from_name?: string;
  from_email?: string;
}

export interface SmsConfig {
  twilio_sid?: string;
  encrypted_twilio_token?: string;
  phone_number?: string;
}

export interface PushConfig {
  firebase_service_account_json_encrypted?: string;
}

export interface CalendarConfig {
  google_client_id?: string;
  google_client_secret_encrypted?: string;
  refresh_token_encrypted?: string;
  redirect_uri?: string;
}

@Entity('notification_settings')
export class NotificationSettings extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_type', type: 'varchar', length: 20 })
  ownerType: 'organization' | 'user';

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ type: 'jsonb' })
  channels: NotificationChannels;

  @Column({ type: 'jsonb', nullable: true })
  email_config: EmailConfig;

  @Column({ type: 'jsonb', nullable: true })
  sms_config: SmsConfig;

  @Column({ type: 'jsonb', nullable: true })
  push_config: PushConfig;

  @Column({ type: 'jsonb', nullable: true })
  calendar_config: CalendarConfig;
}