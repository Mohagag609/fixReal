import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export type DbType = "sqlite" | "postgresql-local" | "postgresql-cloud";

export type AppDbConfig = {
  type: DbType;
  sqlite?: { file: string };
  pgLocal?: { url: string };
  pgCloud?: { url: string };
};

const CONFIG_DIR = join(process.cwd(), "var");
const CONFIG_PATH = join(CONFIG_DIR, "app-config.json");

export function hasConfig() {
  return existsSync(CONFIG_PATH);
}

export function getConfig(): AppDbConfig | null {
  if (!hasConfig()) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading config:", error);
    return null;
  }
}

export function saveConfig(cfg: AppDbConfig) {
  try {
    if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
    return cfg;
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
}