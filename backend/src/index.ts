import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import customerRoutes from './routes/customers';
import unitRoutes from './routes/units';
import contractRoutes from './routes/contracts';
import transactionRoutes from './routes/transactions';
import reportRoutes from './routes/reports';
import installmentRoutes from './routes/installments';
import safeRoutes from './routes/safes';
import partnerRoutes from './routes/partners';
import brokerRoutes from './routes/brokers';
import auditRoutes from './routes/audit';
import notificationRoutes from './routes/notifications';
import exportRoutes from './routes/export';
import partnerGroupRoutes from './routes/partnerGroups';
import partnerDebtRoutes from './routes/partnerDebts';
import brokerDueRoutes from './routes/brokerDues';
import voucherRoutes from './routes/vouchers';
import transferRoutes from './routes/transfers';
import settingsRoutes from './routes/settings';
import backupRoutes from './routes/backup';
import reportBuilderRoutes from './routes/reportBuilder';
import performanceRoutes from './routes/performance';
import adminRoutes from './routes/admin';
import userManagementRoutes from './routes/userManagement';
import advancedSearchRoutes from './routes/advancedSearch';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/safes', safeRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/partner-groups', partnerGroupRoutes);
app.use('/api/partner-debts', partnerDebtRoutes);
app.use('/api/broker-dues', brokerDueRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/report-builder', reportBuilderRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/search', advancedSearchRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 CORS Origin: ${config.corsOrigin}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

export default app;