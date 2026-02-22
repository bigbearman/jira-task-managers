import { registerAs } from '@nestjs/config';

export const configDb = registerAs('db', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'multi_jira',
  synchronize: process.env.DB_SYNC === '1' || process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === '1' || process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === '1' || process.env.DB_SSL === 'true',
}));
