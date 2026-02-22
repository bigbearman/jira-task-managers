import { NotFoundException } from '@nestjs/common';
import { ProjectService } from '../../../src/modules/api/services/project.service';
import { createMockRepository } from '../../helpers/mock-repository';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepo: ReturnType<typeof createMockRepository>;
  let instanceRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    projectRepo = createMockRepository();
    instanceRepo = createMockRepository();
    service = new (ProjectService as any)(projectRepo, instanceRepo);
  });

  describe('findAll', () => {
    it('should return all active projects', async () => {
      const mockProjects = [{ id: '1', name: 'Test Project' }];
      projectRepo.findAllActive.mockResolvedValue(mockProjects);

      const result = await service.findAll();
      expect(result).toEqual(mockProjects);
      expect(projectRepo.findAllActive).toHaveBeenCalled();
    });
  });

  describe('findByInstance', () => {
    it('should return projects for a valid instance', async () => {
      const mockInstance = { id: 'inst-1', slug: 'test' };
      const mockProjects = [{ id: 'p-1', name: 'Project 1' }];
      instanceRepo.findBySlug.mockResolvedValue(mockInstance);
      projectRepo.findByInstanceId.mockResolvedValue(mockProjects);

      const result = await service.findByInstance('test');
      expect(result).toEqual(mockProjects);
      expect(instanceRepo.findBySlug).toHaveBeenCalledWith('test');
      expect(projectRepo.findByInstanceId).toHaveBeenCalledWith('inst-1');
    });

    it('should throw NotFoundException for unknown instance', async () => {
      instanceRepo.findBySlug.mockResolvedValue(null);
      await expect(service.findByInstance('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByKey', () => {
    it('should return project for valid key', async () => {
      const mockProject = { id: 'p-1', jiraProjectKey: 'TEST' };
      projectRepo.findByKey.mockResolvedValue(mockProject);

      const result = await service.findByKey('TEST');
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException for unknown key', async () => {
      projectRepo.findByKey.mockResolvedValue(null);
      await expect(service.findByKey('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return combined stats for a project', async () => {
      const mockProject = { id: 'p-1', jiraProjectKey: 'TEST', jiraProjectId: 'jp-1' };
      projectRepo.findByKey.mockResolvedValue(mockProject);

      const qb = projectRepo.manager.createQueryBuilder();
      qb.getRawOne
        .mockResolvedValueOnce({ total: '10', done: '5', inProgress: '3', todo: '2' })
        .mockResolvedValueOnce({ total: '3', active: '1' })
        .mockResolvedValueOnce({ total: '2', unreleased: '1' });

      const result = await service.getStats('TEST');
      expect(result.project).toEqual(mockProject);
      expect(result.tickets.total).toBe(10);
      expect(result.tickets.done).toBe(5);
      expect(result.sprints.total).toBe(3);
      expect(result.versions.total).toBe(2);
    });

    it('should throw NotFoundException for unknown project', async () => {
      projectRepo.findByKey.mockResolvedValue(null);
      await expect(service.getStats('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });
});
