import type { AppDbConfig } from "./db/config";
import { PrismaClient as PgClient } from "@/prisma/generated/postgres";
import { PrismaClient as SqlClient } from "@/prisma/generated/sqlite";
import { createPrismaLogger, setupPrismaLogging } from "./prisma-logging";

// Type for the union of all possible Prisma clients
export type PrismaClient = PgClient | SqlClient;

// Cache for Prisma clients to avoid recreating them
const clientCache = new Map<string, PrismaClient>();

export function getPrismaClient(cfg: AppDbConfig): PrismaClient {
  const cacheKey = `${cfg.type}-${cfg.pgCloud?.url || cfg.pgLocal?.url || cfg.sqlite?.file || 'default'}`;
  
  // Return cached client if available
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  let client: PrismaClient;

  if (cfg.type === "sqlite") {
    const url = `file:${cfg.sqlite?.file ?? "./data/dev.db"}`;
    client = new SqlClient({
      datasources: { db: { url } },
      log: createPrismaLogger()
    });
  } else {
    const url =
      cfg.type === "postgresql-cloud" ? cfg.pgCloud?.url :
      cfg.type === "postgresql-local" ? cfg.pgLocal?.url :
      undefined;

    if (!url) throw new Error("DATABASE URL not set for selected Postgres type");

    client = new PgClient({
      datasources: { db: { url } },
      log: createPrismaLogger(),
      // إعدادات إضافية لتحسين الاتصال
      __internal: {
        engine: {
          connectTimeout: 60000,
          queryTimeout: 60000,
          poolTimeout: 60000,
        }
      }
    });
  }

  // Setup enhanced logging
  setupPrismaLogging(client);

  // Cache the client
  clientCache.set(cacheKey, client);

  return client;
}

// Function to clear client cache (useful for testing or reconnection)
export function clearPrismaClientCache() {
  clientCache.clear();
}

// Function to get cached client count
export function getCachedClientCount() {
  return clientCache.size;
}