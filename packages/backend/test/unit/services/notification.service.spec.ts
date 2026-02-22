import { NotificationService } from '../../../src/modules/notification/notification.service';
import { NotificationType } from '../../../src/modules/database/entities/notification.entity';
import { createMockRepository, createMockQueueService } from '../../helpers/mock-repository';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepo: ReturnType<typeof createMockRepository>;
  let queueService: ReturnType<typeof createMockQueueService>;

  beforeEach(() => {
    notificationRepo = createMockRepository();
    queueService = createMockQueueService();
    service = new (NotificationService as any)(notificationRepo, queueService);
  });

  describe('sendTelegram', () => {
    it('should create notification and queue Telegram message', async () => {
      notificationRepo.save.mockResolvedValue({ id: 'n-1', channel: 'telegram' });

      const result = await service.sendTelegram('12345', 'Test', 'Hello', NotificationType.INFO);
      expect(result.channel).toBe('telegram');
      expect(notificationRepo.create).toHaveBeenCalled();
      expect(queueService.addTelegramNotification).toHaveBeenCalledWith(
        '12345', 'Hello', undefined, undefined,
      );
    });
  });

  describe('sendWeb', () => {
    it('should create web notification with sentAt set', async () => {
      notificationRepo.save.mockResolvedValue({ id: 'n-2', channel: 'web', sentAt: new Date() });

      const result = await service.sendWeb('user-1', 'Test', 'Hello');
      expect(result.sentAt).toBeDefined();
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'web',
          recipient: 'user-1',
          sentAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getUnread', () => {
    it('should delegate to repository', async () => {
      const mockNotifs = [{ id: 'n-1', isRead: false }];
      notificationRepo.findUnread.mockResolvedValue(mockNotifs);

      const result = await service.getUnread('user-1');
      expect(result).toEqual(mockNotifs);
      expect(notificationRepo.findUnread).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should delegate to repository', async () => {
      await service.markAsRead('n-1');
      expect(notificationRepo.markAsRead).toHaveBeenCalledWith('n-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should delegate to repository', async () => {
      await service.markAllAsRead('user-1');
      expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });
});
