import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, IsNumber, IsEmail } from 'class-validator';

// DTOs for notification settings
export class NotificationChannelsDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  sms: boolean;

  @IsBoolean()
  push: boolean;

  @IsBoolean()
  calendar: boolean;
}

export class EmailConfigDto {
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  smtp_host?: string;

  @IsOptional()
  @IsNumber()
  smtp_port?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  from_name?: string;

  @IsOptional()
  @IsEmail()
  from_email?: string;
}

export class SmsConfigDto {
  @IsOptional()
  @IsString()
  twilio_sid?: string;

  @IsOptional()
  @IsString()
  twilio_token?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;
}

export class PushConfigDto {
  @IsOptional()
  @IsString()
  firebase_service_account_json?: string;
}

export class CalendarConfigDto {
  @IsOptional()
  @IsString()
  google_client_id?: string;

  @IsOptional()
  @IsString()
  google_client_secret?: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;

  @IsOptional()
  @IsString()
  redirect_uri?: string;
}

export class UpdateNotificationSettingsDto {
  @IsString()
  @IsEnum(['organization', 'user'])
  owner_type: 'organization' | 'user';

  @IsNumber()
  owner_id: number;

  @IsObject()
  channels: NotificationChannelsDto;

  @IsOptional()
  @IsObject()
  email_config?: EmailConfigDto;

  @IsOptional()
  @IsObject()
  sms_config?: SmsConfigDto;

  @IsOptional()
  @IsObject()
  push_config?: PushConfigDto;

  @IsOptional()
  @IsObject()
  calendar_config?: CalendarConfigDto;
}

export class GetNotificationSettingsDto {
  @IsString()
  @IsEnum(['organization', 'user'])
  owner_type: 'organization' | 'user';

  @IsNumber()
  owner_id: number;
}

// DTOs for testing notifications
export class TestNotificationDto {
  @IsString()
  @IsEnum(['email', 'sms', 'push', 'calendar'])
  provider: 'email' | 'sms' | 'push' | 'calendar';

  @IsOptional()
  @IsString()
  test_to?: string; // For SMS testing

  @IsOptional()
  @IsString()
  test_email?: string; // For email testing

  @IsOptional()
  @IsString()
  test_device_token?: string; // For push testing

  @IsOptional()
  @IsString()
  test_calendar_event?: string; // For calendar testing
}

// DTO for sending notifications
export class SendNotificationDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  scheduleId: number;

  @IsArray()
  channels: string[];

  @IsObject()
  payload: Record<string, any>;
}