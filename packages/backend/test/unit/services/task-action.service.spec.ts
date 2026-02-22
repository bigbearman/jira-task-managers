import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskActionService } from '../../../src/modules/api/services/task-action.service';
import { createMockRepository, createMockQueueService } from '../../helpers/mock-repository';

describe('TaskActionService', () => {
  let service: TaskActionService;
  let ticketRepo: ReturnType<typeof createMockRepository>;
  let taskActionRepo: ReturnType<typeof createMockRepository>;
  let queueService: ReturnType<typeof createMockQueueService>;

  beforeEach(() => {
    ticketRepo = createMockRepository();
    taskActionRepo = createMockRepository();
    const aiAnalysisRepo = createMockRepository();
    const gitOperationRepo = createMockRepository();
    queueService = createMockQueueService();
    service = new (TaskActionService as any)(
      ticketRepo, taskActionRepo, aiAnalysisRepo, gitOperationRepo, queueService,
    );
  });

  const mockTicket = { id: 'ticket-1', jiraTicketKey: 'TEST-123' };

  describe('analyze', () => {
    it('should create action and queue analysis job', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.save.mockResolvedValue({ id: 'action-1', ticketId: 'ticket-1' });

      const result = await service.analyze('TEST-123', {});
      expect(result.id).toBe('action-1');
      expect(queueService.addAnalyzeTicketJob).toHaveBeenCalledWith('ticket-1', 'action-1');
    });

    it('should throw NotFoundException for unknown ticket', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(null);
      await expect(service.analyze('UNKNOWN', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should create action and queue approve flow', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.findLatestByTicketId.mockResolvedValue(null);
      taskActionRepo.save.mockResolvedValue({ id: 'action-2', ticketId: 'ticket-1' });

      const result = await service.approve('TEST-123', {
        approach: 'Fix the bug',
        projectPath: '/app',
      });
      expect(result.id).toBe('action-2');
      expect(queueService.addFullApproveFlowJob).toHaveBeenCalledWith('ticket-1', 'action-2');
    });

    it('should block if ticket is rejected', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.findLatestByTicketId.mockResolvedValue({
        actionType: 'rejected',
        status: 'completed',
      });

      await expect(
        service.approve('TEST-123', { approach: 'Fix', projectPath: '/app' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should create reject action', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.save.mockResolvedValue({ id: 'action-3', actionType: 'rejected' });

      const result = await service.reject('TEST-123');
      expect(result.actionType).toBe('rejected');
    });
  });

  describe('unreject', () => {
    it('should cancel previous rejection and create unreject action', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.findLatestByTicketId.mockResolvedValue({
        id: 'prev-1',
        actionType: 'rejected',
      });
      taskActionRepo.save.mockResolvedValue({ id: 'action-4', actionType: 'unrejected' });

      const result = await service.unreject('TEST-123');
      expect(result.actionType).toBe('unrejected');
      expect(taskActionRepo.update).toHaveBeenCalledWith('prev-1', { status: 'cancelled' });
    });

    it('should throw if ticket is not rejected', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.findLatestByTicketId.mockResolvedValue({
        actionType: 'approved',
      });

      await expect(service.unreject('TEST-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('editApproach', () => {
    it('should create edit approach action', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      taskActionRepo.save.mockResolvedValue({ id: 'action-5', actionType: 'edit_approach' });

      const result = await service.editApproach('TEST-123', {
        approach: 'New approach',
      });
      expect(result.actionType).toBe('edit_approach');
    });
  });
});
