import { INestApplication } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, createMockProjectService } from './setup';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let projectService: ReturnType<typeof createMockProjectService>;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    projectService = ctx.projectService;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/projects', () => {
    it('should return list of projects', async () => {
      const mockProjects = [
        { id: 'p-1', name: 'Project Alpha', jiraProjectKey: 'ALPHA' },
        { id: 'p-2', name: 'Project Beta', jiraProjectKey: 'BETA' },
      ];
      projectService.findAll.mockResolvedValue(mockProjects);

      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].jiraProjectKey).toBe('ALPHA');
    });

    it('should return empty array when no projects', async () => {
      projectService.findAll.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/projects/:key', () => {
    it('should return project detail', async () => {
      const mockProject = { id: 'p-1', name: 'Project Alpha', jiraProjectKey: 'ALPHA' };
      projectService.findByKey.mockResolvedValue(mockProject);

      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/ALPHA')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jiraProjectKey).toBe('ALPHA');
      expect(projectService.findByKey).toHaveBeenCalledWith('ALPHA');
    });

    it('should return 404 for unknown project', async () => {
      projectService.findByKey.mockRejectedValue(new NotFoundException('Project not found'));

      await request(app.getHttpServer())
        .get('/api/v1/projects/UNKNOWN')
        .expect(404);
    });
  });

  describe('GET /api/v1/projects/:key/stats', () => {
    it('should return project stats', async () => {
      const mockStats = {
        project: { id: 'p-1', jiraProjectKey: 'ALPHA' },
        tickets: { total: 10, done: 5, inProgress: 3, todo: 2 },
        sprints: { total: 3, active: 1 },
        versions: { total: 2, unreleased: 1 },
      };
      projectService.getStats.mockResolvedValue(mockStats);

      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/ALPHA/stats')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tickets.total).toBe(10);
      expect(res.body.data.sprints.active).toBe(1);
    });

    it('should return 404 for unknown project stats', async () => {
      projectService.getStats.mockRejectedValue(new NotFoundException('Project not found'));

      await request(app.getHttpServer())
        .get('/api/v1/projects/UNKNOWN/stats')
        .expect(404);
    });
  });
});
