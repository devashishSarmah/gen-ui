import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from root .env
config({ path: join(process.cwd(), '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'genui',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'genui_dev',
  entities: ['apps/backend/src/entities/*.entity.ts'],
  migrations: ['apps/backend/src/migrations/*.ts'],
  synchronize: false,
  logging: ['error', 'warn', 'migration', 'schema'],
});
