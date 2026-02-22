import { DashboardService } from '../../../src/modules/api/services/dashboard.service';
import { createMockRepository } from '../../helpers/mock-repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let projectRepo: ReturnType<typeof createMockRepository>;
  let sprintRepo: ReturnType<typeof createMockRepository>;
  let taskActionRepo: ReturnType<typeof createMockRepository>;
  let aiAnalysisRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    projectRepo = createMockRepository();
    sprintRepo = createMockRepository();
    taskActionRepo = createMockRepository();
    aiAnalysisRepo = createMockRepository();
    service = new (DashboardService as any)(
      projectRepo, sprintRepo, taskActionRepo, aiAnalysisRepo,
    );
  });

  describe('getOverview', () => {
    it('should return combined dashboard data', async () => {
      projectRepo.findAllActive.mockResolvedValue([
        { id: 'p-1', jiraProjectKey: 'TEST', name: 'Test Project' },
      ]);

      const qb = projectRepo.manager.createQueryBuilder();
      qb.getRawOne.mockResolvedValue({ total: '10', done: '5', inProgress: '3', todo: '2' });

      sprintRepo.findActive.mockResolvedValue([{ id: 's-1', name: 'Sprint 1', state: 'active' }]);
      taskActionRepo.find.mockResolvedValue([]);

      const result = await service.getOverview();
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].key).toBe('TEST');
      expect(result.tickets.total).toBe(10);
      expect(result.activeSprints).toHaveLength(1);
    });
  });

  describe('getSprintVelocity', () => {
    it('should return sprint velocity metrics', async () => {
      const mockData = [
        { sprintId: 's-1', sprintName: 'Sprint 1', totalTickets: '5', completedTickets: '3' },
      ];
      const qb = sprintRepo.manager.createQueryBuilder();
      qb.getRawMany.mockResolvedValue(mockData);

      const result = await service.getSprintVelocity();
      expect(result).toEqual(mockData);
    });

    it('should filter by project key when provided', async () => {
      const qb = sprintRepo.manager.createQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);

      await service.getSprintVelocity('TEST');
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe('getAiStats', () => {
    it('should return AI usage statistics', async () => {
      const qb = aiAnalysisRepo.manager.createQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalAnalyses: '20',
        completed: '18',
        failed: '2',
        totalTokens: '50000',
        totalCostUsd: '1.50',
        avgDurationMs: '3500',
      });
      aiAnalysisRepo.find.mockResolvedValue([]);

      const result = await service.getAiStats();
      expect(result.totalAnalyses).toBe(20);
      expect(result.completed).toBe(18);
      expect(result.failed).toBe(2);
      expect(result.totalTokens).toBe(50000);
      expect(result.totalCostUsd).toBe(1.5);
      expect(result.avgDurationMs).toBe(3500);
    });
  });
});
