import { NotFoundException } from '@nestjs/common';
import { SprintService } from '../../../src/modules/api/services/sprint.service';
import { createMockRepository } from '../../helpers/mock-repository';

describe('SprintService', () => {
  let service: SprintService;
  let sprintRepo: ReturnType<typeof createMockRepository>;
  let ticketRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    sprintRepo = createMockRepository();
    ticketRepo = createMockRepository();
    service = new (SprintService as any)(sprintRepo, ticketRepo);
  });

  describe('findByProject', () => {
    it('should return sprints for valid project', async () => {
      const mockSprints = [{ id: 's-1', name: 'Sprint 1' }];
      const qb = sprintRepo.manager.createQueryBuilder();
      qb.getRawOne.mockResolvedValue({ jira_project_id: 'jp-1' });
      sprintRepo.findByProjectId.mockResolvedValue(mockSprints);

      const result = await service.findByProject('TEST');
      expect(result).toEqual(mockSprints);
    });

    it('should throw NotFoundException for unknown project', async () => {
      const qb = sprintRepo.manager.createQueryBuilder();
      qb.getRawOne.mockResolvedValue(null);
      await expect(service.findByProject('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return sprint with relations', async () => {
      const mockSprint = { id: 's-1', name: 'Sprint 1', project: {} };
      sprintRepo.findOne.mockResolvedValue(mockSprint);

      const result = await service.findById('s-1');
      expect(result).toEqual(mockSprint);
    });

    it('should throw NotFoundException for unknown sprint', async () => {
      sprintRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActive', () => {
    it('should return all active sprints when no filter', async () => {
      const mockSprints = [{ id: 's-1', state: 'active' }];
      sprintRepo.findActive.mockResolvedValue(mockSprints);

      const result = await service.findActive();
      expect(result).toEqual(mockSprints);
      expect(sprintRepo.findActive).toHaveBeenCalledWith();
    });

    it('should filter by project key when provided', async () => {
      const qb = sprintRepo.manager.createQueryBuilder();
      qb.getRawOne.mockResolvedValue({ jira_project_id: 'jp-1' });
      sprintRepo.findActive.mockResolvedValue([]);

      await service.findActive('TEST');
      expect(sprintRepo.findActive).toHaveBeenCalledWith('jp-1');
    });
  });

  describe('getTickets', () => {
    it('should return paginated tickets for sprint', async () => {
      sprintRepo.findOne.mockResolvedValue({ id: 's-1' });
      ticketRepo.findWithFilters.mockResolvedValue([[], 0]);

      await service.getTickets('s-1', 1, 20);
      expect(ticketRepo.findWithFilters).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown sprint', async () => {
      sprintRepo.findOne.mockResolvedValue(null);
      await expect(service.getTickets('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
