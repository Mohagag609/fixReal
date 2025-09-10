import type { AppDbConfig } from "./db/config";
import { PrismaClient as PgClient } from "@/prisma/generated/postgres";
import { PrismaClient as SqlClient } from "@/prisma/generated/sqlite";

// Type for the union of all possible Prisma clients
export type PrismaClient = PgClient | SqlClient;

export function getPrismaClient(cfg: AppDbConfig): PrismaClient {
  if (cfg.type === "sqlite") {
    const url = `file:${cfg.sqlite?.file ?? "./data/dev.db"}`;
    return new SqlClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    });
  }

  const url =
    cfg.type === "postgresql-cloud" ? cfg.pgCloud?.url :
    cfg.type === "postgresql-local" ? cfg.pgLocal?.url :
    undefined;

  if (!url) throw new Error("DATABASE URL not set for selected Postgres type");

  return new PgClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
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