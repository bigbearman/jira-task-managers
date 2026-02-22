import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 with health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('ok');
          expect(res.body.data.timestamp).toBeDefined();
          expect(res.body.data.uptime).toBeDefined();
        });
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for unknown endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .expect(404);
    });
  });
});
