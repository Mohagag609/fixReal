import { PrismaClient } from '@prisma/client';
import { getConfig } from './config';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const config = getConfig();
    
    if (!config) {
      // استخدام SQLite كافتراضي
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: 'file:./data/dev.db'
          }
        }
      });
    } else {
      let databaseUrl: string;
      
      switch (config.type) {
        case 'sqlite':
          databaseUrl = config.sqlite?.file || 'file:./data/dev.db';
          break;
        case 'postgresql-local':
          databaseUrl = config.pgLocal?.url || 'postgresql://postgres:postgres@localhost:5432/estate_db?schema=public';
          break;
        case 'postgresql-cloud':
          databaseUrl = config.pgCloud?.url || 'postgresql://postgres:postgres@localhost:5432/estate_db?schema=public';
          break;
        default:
          databaseUrl = 'file:./data/dev.db';
      }
      
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });
    }
  }
  
  return prismaInstance;
}

export const prisma = getPrismaClient();
export default prisma;
