import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  UsePipes,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NetworkDiagnosticsService } from './network-diagnostics.service';
import {
  UpdateNotificationSettingsDto,
  GetNotificationSettingsDto,
  TestNotificationDto,
  SendNotificationDto,
} from '../dtos/notification.dto';
import { NotificationSettings } from '../entities/notification-settings.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { NotificationSettingsValidationPipe } from './notification-validation.pipe';

@ApiTags('Notification Settings')
@Controller('api/settings/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationSettingsController {
  private readonly logger = new Logger(NotificationSettingsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly networkDiagnosticsService: NetworkDiagnosticsService,
  ) {}

  @Get()
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get notification settings for current user/organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({
    name: 'owner_type',
    required: false,
    description: 'Owner type (organization|user)',
  })
  @ApiQuery({ name: 'owner_id', required: false, description: 'Owner ID' })
  async getNotificationSettings(
    @Request() req,
    @Query('owner_type') ownerType?: 'organization' | 'user',
    @Query('owner_id') ownerId?: number,
  ): Promise<any> {
    // Default to current user if not specified
    if (!ownerType) ownerType = 'user';
    if (!ownerId) ownerId = req.user.id;

    // Check permissions - users can only access their own settings unless they're super_admin
    if (
      ownerType === 'user' &&
      ownerId !== req.user.id &&
      req.user.role !== 'super_admin'
    ) {
      throw new Error('Unauthorized to access these settings');
    }

    if (!ownerType || !ownerId) {
      throw new Error('Owner type and owner ID are required');
    }
    const settings = await this.notificationsService.getNotificationSettings(
      ownerType,
      ownerId,
    );
    if (!settings) {
      return null;
    }
    return this.notificationsService.getMaskedSettings(settings);
  }

  @Get('health')
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check notification system health' })
  @ApiResponse({ status: 200, description: 'Health check results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async healthCheck(@Request() req): Promise<any> {
    this.logger.log(`Health check initiated by user ${req.user.id}`);

    // Test internal connectivity
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        email: 'unknown',
        sms: 'unknown',
        push: 'unknown',
        calendar: 'unknown',
      },
      network: 'unknown',
    };

    try {
      // Test database connectivity by fetching settings
      await this.notificationsService.getNotificationSettings(
        'user',
        req.user.id,
      );
      healthStatus.services.database = 'connected';
      healthStatus.network = 'reachable';
    } catch (error) {
      healthStatus.services.database = `disconnected: ${error.message}`;
      healthStatus.status = 'degraded';
      this.logger.error(`Database connectivity issue: ${error.message}`);
    }

    return healthStatus;
  }

  @Get('diagnostics')
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Run network diagnostics for notification services',
  })
  @ApiResponse({ status: 200, description: 'Diagnostics results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async runDiagnostics(@Request() req): Promise<any> {
    this.logger.log(`Network diagnostics initiated by user ${req.user.id}`);

    try {
      const diagnostics =
        await this.networkDiagnosticsService.runComprehensiveDiagnostics();
      return {
        success: true,
        diagnostics,
      };
    } catch (error) {
      this.logger.error(`Diagnostics failed: ${error.message}`);
      return {
        success: false,
        message: `Diagnostics failed: ${error.message}`,
      };
    }
  }

  @Put()
  @Roles('super_admin', 'lecturer', 'student')
  @UsePipes(NotificationSettingsValidationPipe)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({
    status: 200,
    description: 'Notification settings updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: UpdateNotificationSettingsDto })
  async updateNotificationSettings(
    @Request() req,
    @Body() updateNotificationSettingsDto: UpdateNotificationSettingsDto,
  ): Promise<any> {
    // Check permissions - users can only update their own settings unless they're super_admin
    if (
      updateNotificationSettingsDto.owner_type === 'user' &&
      updateNotificationSettingsDto.owner_id !== req.user.id &&
      req.user.role !== 'super_admin'
    ) {
      throw new Error('Unauthorized to update these settings');
    }

    const settings = await this.notificationsService.updateNotificationSettings(
      updateNotificationSettingsDto,
      req.user.id,
    );
    return this.notificationsService.getMaskedSettings(settings);
  }

  @Post('test')
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test notification sending' })
  @ApiResponse({ status: 200, description: 'Test notification result' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: TestNotificationDto })
  async testNotification(
    @Request() req,
    @Body() testNotificationDto: TestNotificationDto,
  ): Promise<{ success: boolean; message: string }> {
    // Validate the test notification DTO
    if (!testNotificationDto.provider) {
      return { success: false, message: 'Provider is required' };
    }

    // Validate provider-specific requirements
    switch (testNotificationDto.provider) {
      case 'sms':
        if (!testNotificationDto.test_to) {
          return {
            success: false,
            message: 'Test phone number is required for SMS testing',
          };
        }
        break;
      case 'email':
        if (!testNotificationDto.test_email) {
          return {
            success: false,
            message: 'Test email address is required for email testing',
          };
        }
        break;
      case 'push':
        if (!testNotificationDto.test_device_token) {
          return {
            success: false,
            message:
              'Test device token is required for push notification testing',
          };
        }
        break;
    }

    // Get user's settings for testing
    const settings = await this.notificationsService.getNotificationSettings(
      'user',
      req.user.id,
    );

    if (!settings) {
      return {
        success: false,
        message: 'No notification settings found for this user',
      };
    }

    // Get the appropriate configuration based on provider
    let config;
    switch (testNotificationDto.provider) {
      case 'email':
        config = settings.email_config;
        break;
      case 'sms':
        config = settings.sms_config;
        break;
      case 'push':
        config = settings.push_config;
        break;
      case 'calendar':
        config = settings.calendar_config;
        break;
      default:
        return { success: false, message: 'Unsupported provider' };
    }

    if (!config) {
      return {
        success: false,
        message: `No configuration found for ${testNotificationDto.provider}`,
      };
    }

    return this.notificationsService.testNotification(
      testNotificationDto.provider,
      config,
      testNotificationDto.test_to ||
        testNotificationDto.test_email ||
        testNotificationDto.test_device_token ||
        '',
    );
  }

  @Post('send')
  @Roles('super_admin', 'system')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification (internal endpoint)' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: SendNotificationDto })
  async sendNotification(
    @Body() sendNotificationDto: SendNotificationDto,
  ): Promise<void> {
    // Validate the send notification DTO
    if (!sendNotificationDto.userId || sendNotificationDto.userId <= 0) {
      throw new Error('Valid user ID is required');
    }
    if (
      !sendNotificationDto.scheduleId ||
      sendNotificationDto.scheduleId <= 0
    ) {
      throw new Error('Valid schedule ID is required');
    }
    if (
      !sendNotificationDto.channels ||
      sendNotificationDto.channels.length === 0
    ) {
      throw new Error('At least one channel is required');
    }
    if (!sendNotificationDto.payload) {
      throw new Error('Payload is required');
    }
    await this.notificationsService.sendNotification(
      sendNotificationDto.userId,
      sendNotificationDto.scheduleId,
      sendNotificationDto.channels,
      sendNotificationDto.payload,
    );
  }
}
