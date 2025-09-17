import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import apiRoutes from './routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Real Estate Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      properties: '/api/properties',
      contracts: '/api/contracts',
      tenants: '/api/tenants',
      invoices: '/api/invoices',
      payments: '/api/payments',
      expenses: '/api/expenses',
      reports: '/api/reports',
    },
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error: Error, _req: Request, res: Response, _next: any) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    message: process.env['NODE_ENV'] === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env['NODE_ENV'] !== 'production' && { stack: error.stack }),
  });
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});

export default app;