/**
 * إعداد البيئة - للتبديل بين المحلي والسحابي
 * Environment Setup - Switch between Local and Cloud
 */

const fs = require('fs');
const path = require('path');

class EnvironmentSetup {
    constructor() {
        this.envFiles = {
            local: '.env.local',
            production: '.env.production',
            netlify: '.env.netlify'
        };
    }

    /**
     * إعداد البيئة المحلية
     * Setup local environment
     */
    setupLocal() {
        console.log('🏠 إعداد البيئة المحلية...');
        
        const localEnv = {
            // Local PostgreSQL Database
            DATABASE_URL: "postgresql://postgres:password@localhost:5432/estate_pro_db?schema=public",
            
            // Neon Cloud Database (for backup/sync)
            NEON_DATABASE_URL: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            
            // Development Settings
            NODE_ENV: "development",
            PORT: "3000",
            
            // JWT Configuration
            JWT_SECRET: "dev-jwt-secret-key-change-in-production",
            JWT_EXPIRES_IN: "7d",
            
            // API Configuration
            API_BASE_URL: "http://localhost:3000/api",
            NEXT_PUBLIC_API_URL: "http://localhost:3000/api",
            
            // Database Pool Settings
            DB_POOL_MIN: "2",
            DB_POOL_MAX: "10",
            DB_POOL_IDLE_TIMEOUT_MS: "30000",
            
            // Backup Settings
            BACKUP_DIR: "./backups",
            MAX_BACKUPS: "10",
            BACKUP_RETENTION_DAYS: "30",
            
            // Logging
            LOG_LEVEL: "debug",
            ENABLE_QUERY_LOGGING: "true",
            
            // Feature Flags
            ENABLE_AUDIT_LOGS: "true",
            ENABLE_NOTIFICATIONS: "true",
            ENABLE_BACKUP_AUTOMATION: "true",
            
            // Database Mode
            DB_MODE: "local"
        };

        this.writeEnvFile(this.envFiles.local, localEnv);
        console.log('✅ تم إعداد البيئة المحلية');
    }

    /**
     * إعداد بيئة الإنتاج
     * Setup production environment
     */
    setupProduction() {
        console.log('☁️ إعداد بيئة الإنتاج...');
        
        const productionEnv = {
            // Production Database (Neon Cloud)
            DATABASE_URL: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            
            // Neon Cloud Database (same as above for consistency)
            NEON_DATABASE_URL: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            
            // Production Settings
            NODE_ENV: "production",
            PORT: "3000",
            
            // JWT Configuration (use strong secret in production)
            JWT_SECRET: "your-super-strong-production-jwt-secret-here",
            JWT_EXPIRES_IN: "24h",
            
            // API Configuration
            API_BASE_URL: "https://your-domain.com/api",
            NEXT_PUBLIC_API_URL: "https://your-domain.com/api",
            
            // Database Pool Settings
            DB_POOL_MIN: "5",
            DB_POOL_MAX: "20",
            DB_POOL_IDLE_TIMEOUT_MS: "30000",
            
            // Backup Settings
            BACKUP_DIR: "/app/backups",
            MAX_BACKUPS: "30",
            BACKUP_RETENTION_DAYS: "90",
            
            // Logging
            LOG_LEVEL: "warn",
            ENABLE_QUERY_LOGGING: "false",
            
            // Feature Flags
            ENABLE_AUDIT_LOGS: "true",
            ENABLE_NOTIFICATIONS: "true",
            ENABLE_BACKUP_AUTOMATION: "true",
            
            // Security
            CORS_ORIGIN: "https://your-domain.com",
            RATE_LIMIT_WINDOW_MS: "900000",
            RATE_LIMIT_MAX_REQUESTS: "100",
            
            // Database Mode
            DB_MODE: "cloud"
        };

        this.writeEnvFile(this.envFiles.production, productionEnv);
        console.log('✅ تم إعداد بيئة الإنتاج');
    }

    /**
     * إعداد بيئة Netlify
     * Setup Netlify environment
     */
    setupNetlify() {
        console.log('🌐 إعداد بيئة Netlify...');
        
        const netlifyEnv = {
            // Netlify Database (Neon Cloud)
            DATABASE_URL: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            
            // Neon Cloud Database (same as above for consistency)
            NEON_DATABASE_URL: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
            
            // Netlify Settings
            NODE_ENV: "production",
            PORT: "3000",
            
            // JWT Configuration
            JWT_SECRET: "netlify-production-jwt-secret-key",
            JWT_EXPIRES_IN: "24h",
            
            // API Configuration
            API_BASE_URL: "https://your-netlify-app.netlify.app/api",
            NEXT_PUBLIC_API_URL: "https://your-netlify-app.netlify.app/api",
            
            // Database Pool Settings
            DB_POOL_MIN: "5",
            DB_POOL_MAX: "15",
            DB_POOL_IDLE_TIMEOUT_MS: "30000",
            
            // Backup Settings
            BACKUP_DIR: "/tmp/backups",
            MAX_BACKUPS: "10",
            BACKUP_RETENTION_DAYS: "30",
            
            // Logging
            LOG_LEVEL: "info",
            ENABLE_QUERY_LOGGING: "false",
            
            // Feature Flags
            ENABLE_AUDIT_LOGS: "true",
            ENABLE_NOTIFICATIONS: "true",
            ENABLE_BACKUP_AUTOMATION: "false",
            
            // Security
            CORS_ORIGIN: "https://your-netlify-app.netlify.app",
            RATE_LIMIT_WINDOW_MS: "900000",
            RATE_LIMIT_MAX_REQUESTS: "100",
            
            // Database Mode
            DB_MODE: "cloud"
        };

        this.writeEnvFile(this.envFiles.netlify, netlifyEnv);
        console.log('✅ تم إعداد بيئة Netlify');
    }

    /**
     * كتابة ملف البيئة
     * Write environment file
     */
    writeEnvFile(filename, envVars) {
        const envContent = Object.entries(envVars)
            .map(([key, value]) => `${key}="${value}"`)
            .join('\n');

        const filePath = path.join(process.cwd(), filename);
        fs.writeFileSync(filePath, envContent);
    }

    /**
     * نسخ ملف البيئة
     * Copy environment file
     */
    copyEnvFile(source, target) {
        const sourcePath = path.join(process.cwd(), source);
        const targetPath = path.join(process.cwd(), target);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`✅ تم نسخ ${source} إلى ${target}`);
        } else {
            console.log(`❌ ملف ${source} غير موجود`);
        }
    }

    /**
     * إعداد جميع البيئات
     * Setup all environments
     */
    setupAll() {
        console.log('🚀 إعداد جميع البيئات...');
        this.setupLocal();
        this.setupProduction();
        this.setupNetlify();
        console.log('✅ تم إعداد جميع البيئات بنجاح');
    }

    /**
     * عرض المساعدة
     * Show help
     */
    showHelp() {
        console.log(`
🔧 إعداد البيئة - Environment Setup

الاستخدام:
  node scripts/setup-environment.js [command]

الأوامر المتاحة:
  local       - إعداد البيئة المحلية
  production  - إعداد بيئة الإنتاج
  netlify     - إعداد بيئة Netlify
  all         - إعداد جميع البيئات
  help        - عرض هذه المساعدة

أمثلة:
  node scripts/setup-environment.js local
  node scripts/setup-environment.js all
        `);
    }
}

// تشغيل السكريبت
const setup = new EnvironmentSetup();
const command = process.argv[2];

switch (command) {
    case 'local':
        setup.setupLocal();
        break;
    case 'production':
        setup.setupProduction();
        break;
    case 'netlify':
        setup.setupNetlify();
        break;
    case 'all':
        setup.setupAll();
        break;
    case 'help':
    default:
        setup.showHelp();
        break;
}