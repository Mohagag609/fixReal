import { PrismaClient } from '@prisma/client';

// Mock Prisma client for testing
jest.mock('../config/database', () => ({
  __esModule: true,
  default: new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
      }
    }
  })
}));

// Global test setup
beforeAll(async () => {
  // Setup test database if needed
});

afterAll(async () => {
  // Cleanup test database if needed
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});