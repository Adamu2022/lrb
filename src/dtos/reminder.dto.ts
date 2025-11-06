import { IsInt, IsEnum, IsDateString, IsOptional } from 'class-validator';

export class CreateReminderDto {
  @IsInt()
  scheduleId: number;

  @IsInt()
  userId: number;

  @IsEnum(['sms', 'email', 'push', 'calendar'])
  channel: 'sms' | 'email' | 'push' | 'calendar';
}

export class UpdateReminderDto {
  @IsEnum(['pending', 'sent', 'failed'])
  status: 'pending' | 'sent' | 'failed';

  @IsDateString()
  @IsOptional()
  sentAt?: Date;
}