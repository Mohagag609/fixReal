import { PrismaClient } from '@prisma/client'

export type DatabaseType = 'postgresql-cloud' | 'postgresql-local' | 'sqlite'

export interface DatabaseConfig {
  type: DatabaseType
  url: string
  provider: 'postgresql' | 'sqlite'
}

export class DatabaseManager {
  private static instance: DatabaseManager
  private config: DatabaseConfig

  private constructor() {
    this.config = this.determineDatabaseConfig()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private determineDatabaseConfig(): DatabaseConfig {
    const databaseType = process.env.DATABASE_TYPE as DatabaseType

    if (!databaseType) {
      throw new Error('DATABASE_TYPE environment variable is required')
    }

    let url: string
    let provider: 'postgresql' | 'sqlite'

    switch (databaseType) {
      case 'postgresql-cloud':
        url = process.env.DATABASE_URL_POSTGRES_CLOUD || process.env.DATABASE_URL || ''
        provider = 'postgresql'
        break
      case 'postgresql-local':
        url = process.env.DATABASE_URL_POSTGRES_LOCAL || process.env.DATABASE_URL || ''
        provider = 'postgresql'
        break
      case 'sqlite':
        url = process.env.DATABASE_URL_SQLITE || process.env.DATABASE_URL || ''
        provider = 'sqlite'
        break
      default:
        throw new Error(`Unsupported DATABASE_TYPE: ${databaseType}`)
    }

    if (!url) {
      throw new Error(`Database URL not found for type: ${databaseType}`)
    }

    return { type: databaseType, url, provider }
  }

  public getConfig(): DatabaseConfig {
    return this.config
  }

  public getPrismaClient(): PrismaClient {
    return new PrismaClient({
      datasources: {
        db: {
          url: this.config.url
        }
      }
    })
  }

  public isPostgreSQL(): boolean {
    return this.config.provider === 'postgresql'
  }

  public isSQLite(): boolean {
    return this.config.provider === 'sqlite'
  }

  public getDatabaseType(): DatabaseType {
    return this.config.type
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance()
export const prisma = databaseManager.getPrismaClient()