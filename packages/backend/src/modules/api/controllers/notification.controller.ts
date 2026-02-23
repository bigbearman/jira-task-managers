import { Controller, Get, Patch, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotificationService } from '@/notification/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get recent notifications for a recipient' })
  async getRecent(@Query('recipient') recipient: string, @Query('limit') limit?: number) {
    const data = await this.notificationService.getRecent(recipient, limit);
    return { success: true, data };
  }

  @Get('unread')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Get unread notifications for a recipient' })
  async getUnread(@Query('recipient') recipient: string) {
    const data = await this.notificationService.getUnread(recipient);
    return { success: true, data, count: data.length };
  }

  @Patch(':id/read')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(id);
    return { success: true };
  }

  @Post('read-all')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Mark all notifications as read for a recipient' })
  async markAllAsRead(@Query('recipient') recipient: string) {
    await this.notificationService.markAllAsRead(recipient);
    return { success: true };
  }
}
