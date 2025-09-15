import type { AppDbConfig } from "./db/config";
import { PrismaClient } from "@prisma/client";
import { createPrismaLogger, setupPrismaLogging } from "./prisma-logging";

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
    client = new PrismaClient({
      datasources: { db: { url } },
      log: createPrismaLogger()
    });
  } else {
    const url =
      cfg.type === "postgresql-cloud" ? cfg.pgCloud?.url :
      cfg.type === "postgresql-local" ? cfg.pgLocal?.url :
      undefined;

    if (!url) throw new Error("DATABASE URL not set for selected Postgres type");

    client = new PrismaClient({
      datasources: { 
        db: { 
          url: url
        } 
      },
      log: createPrismaLogger()
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