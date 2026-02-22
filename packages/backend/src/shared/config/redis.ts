import { registerAs } from '@nestjs/config';

export const configRedis = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DATABASE) || 0,
}));
