import { NotFoundException } from '@nestjs/common';
import { TicketService } from '../../../src/modules/api/services/ticket.service';
import { createMockRepository } from '../../helpers/mock-repository';

// Mock the pagination util
jest.mock('../../../src/shared/utils/pagination', () => ({
  getDefaultPagination: (page = 1, limit = 20) => ({ page, limit }),
  paginate: (data: any[], total: number, pagination: any) => ({
    data,
    meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) },
  }),
}));

describe('TicketService', () => {
  let service: TicketService;
  let ticketRepo: ReturnType<typeof createMockRepository>;
  let aiAnalysisRepo: ReturnType<typeof createMockRepository>;
  let gitOperationRepo: ReturnType<typeof createMockRepository>;
  let taskActionRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    ticketRepo = createMockRepository();
    aiAnalysisRepo = createMockRepository();
    gitOperationRepo = createMockRepository();
    taskActionRepo = createMockRepository();
    const instanceRepo = createMockRepository();
    service = new (TicketService as any)(
      ticketRepo, taskActionRepo, aiAnalysisRepo, gitOperationRepo, instanceRepo,
    );
  });

  const mockTicket = { id: 'ticket-1', jiraTicketKey: 'TEST-123' };

  describe('findWithFilters', () => {
    it('should return paginated tickets', async () => {
      ticketRepo.findWithFilters.mockResolvedValue([
        [{ id: '1', jiraTicketKey: 'TEST-1' }],
        1,
      ]);

      const result = await service.findWithFilters({ page: 1, limit: 20 });
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findByKey', () => {
    it('should return ticket for valid key', async () => {
      ticketRepo.findByKey.mockResolvedValue(mockTicket);
      const result = await service.findByKey('TEST-123');
      expect(result.jiraTicketKey).toBe('TEST-123');
    });

    it('should throw NotFoundException for unknown key', async () => {
      ticketRepo.findByKey.mockResolvedValue(null);
      await expect(service.findByKey('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAiAnalysis', () => {
    it('should return analyses for ticket', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      const mockAnalyses = [{ id: 'a-1', analysisType: 'summary' }];
      aiAnalysisRepo.findByTicketId.mockResolvedValue(mockAnalyses);

      const result = await service.getAiAnalysis('TEST-123');
      expect(result).toEqual(mockAnalyses);
    });

    it('should throw NotFoundException for unknown ticket', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(null);
      await expect(service.getAiAnalysis('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGitStatus', () => {
    it('should return git operations for ticket', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      const mockOps = [{ id: 'g-1', operationType: 'branch_create' }];
      gitOperationRepo.findByTicketId.mockResolvedValue(mockOps);

      const result = await service.getGitStatus('TEST-123');
      expect(result).toEqual(mockOps);
    });
  });

  describe('getActions', () => {
    it('should return action history for ticket', async () => {
      ticketRepo.findByKeySimple.mockResolvedValue(mockTicket);
      const mockActions = [{ id: 'act-1', actionType: 'approved' }];
      taskActionRepo.findByTicketId.mockResolvedValue(mockActions);

      const result = await service.getActions('TEST-123');
      expect(result).toEqual(mockActions);
    });
  });
});
