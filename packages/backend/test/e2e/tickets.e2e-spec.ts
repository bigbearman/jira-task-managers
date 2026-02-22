import { INestApplication } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  createMockTicketService,
  createMockTaskActionService,
} from './setup';

describe('Tickets (e2e)', () => {
  let app: INestApplication;
  let ticketService: ReturnType<typeof createMockTicketService>;
  let taskActionService: ReturnType<typeof createMockTaskActionService>;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    ticketService = ctx.ticketService;
    taskActionService = ctx.taskActionService;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/tickets', () => {
    it('should return paginated ticket list', async () => {
      ticketService.findWithFilters.mockResolvedValue({
        data: [{ id: 't-1', jiraTicketKey: 'TEST-1', summary: 'Fix bug' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/tickets')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('should pass query params to service', async () => {
      ticketService.findWithFilters.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await request(app.getHttpServer())
        .get('/api/v1/tickets?projectKey=TEST&status=open&page=2&limit=10')
        .expect(200);

      expect(ticketService.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ projectKey: 'TEST', status: 'open' }),
      );
    });
  });

  describe('GET /api/v1/tickets/:key', () => {
    it('should return ticket detail', async () => {
      const mockTicket = {
        id: 't-1',
        jiraTicketKey: 'TEST-123',
        summary: 'Fix authentication bug',
        status: 'In Progress',
      };
      ticketService.findByKey.mockResolvedValue(mockTicket);

      const res = await request(app.getHttpServer())
        .get('/api/v1/tickets/TEST-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.jiraTicketKey).toBe('TEST-123');
    });

    it('should return 404 for unknown ticket', async () => {
      ticketService.findByKey.mockRejectedValue(new NotFoundException('Ticket not found'));

      await request(app.getHttpServer())
        .get('/api/v1/tickets/UNKNOWN-999')
        .expect(404);
    });
  });

  describe('GET /api/v1/tickets/:key/ai-analysis', () => {
    it('should return AI analyses for ticket', async () => {
      const mockAnalyses = [
        { id: 'a-1', analysisType: 'summary', status: 'completed' },
      ];
      ticketService.getAiAnalysis.mockResolvedValue(mockAnalyses);

      const res = await request(app.getHttpServer())
        .get('/api/v1/tickets/TEST-123/ai-analysis')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/tickets/:key/analyze', () => {
    it('should queue analysis and return 201', async () => {
      const mockAction = { id: 'action-1', actionType: 'analyze', status: 'pending' };
      taskActionService.analyze.mockResolvedValue(mockAction);

      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets/TEST-123/analyze')
        .send({})
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.actionType).toBe('analyze');
      expect(res.body.message).toBe('Analysis queued');
    });

    it('should return 404 for unknown ticket', async () => {
      taskActionService.analyze.mockRejectedValue(new NotFoundException('Ticket not found'));

      await request(app.getHttpServer())
        .post('/api/v1/tickets/UNKNOWN/analyze')
        .send({})
        .expect(404);
    });
  });

  describe('POST /api/v1/tickets/:key/approve', () => {
    it('should queue approve flow', async () => {
      const mockAction = { id: 'action-2', actionType: 'approved', status: 'pending' };
      taskActionService.approve.mockResolvedValue(mockAction);

      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets/TEST-123/approve')
        .send({ approach: 'Fix the bug by refactoring', projectPath: '/app' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Approve flow queued');
    });
  });

  describe('POST /api/v1/tickets/:key/reject', () => {
    it('should create reject action', async () => {
      const mockAction = { id: 'action-3', actionType: 'rejected' };
      taskActionService.reject.mockResolvedValue(mockAction);

      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets/TEST-123/reject')
        .send({})
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.actionType).toBe('rejected');
    });
  });
});
