import { TransactionService } from '../../src/services/transaction.service';
import prisma from '../../src/config/db';

// Mock Prisma
jest.mock('../../src/config/db');

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService();
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a new transaction and update account balance', async () => {
      const transactionData = {
        amount: 1000,
        type: 'credit' as const,
        description: 'Test Transaction',
        category: 'rent' as const,
        accountId: 1,
        propertyId: 1,
      };

      const mockTransaction = {
        id: 1,
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAccount = {
        id: 1,
        name: 'Test Account',
        type: 'asset',
        balance: 0,
        transactions: [],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          transaction: {
            create: jest.fn().mockResolvedValue(mockTransaction),
          },
          account: {
            findUnique: jest.fn().mockResolvedValue(mockAccount),
            update: jest.fn().mockResolvedValue({ ...mockAccount, balance: 1000 }),
          },
        };
        return callback(mockTx);
      });

      const result = await transactionService.createTransaction(transactionData);

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions with related data', async () => {
      const mockTransactions = [
        {
          id: 1,
          amount: 1000,
          type: 'credit',
          description: 'Test Transaction',
          category: 'rent',
          accountId: 1,
          propertyId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          account: {
            id: 1,
            name: 'Test Account',
            type: 'asset',
          },
          property: {
            id: 1,
            title: 'Test Property',
            address: 'Test Address',
          },
        },
      ];

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await transactionService.getAllTransactions();

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', async () => {
      const mockTransaction = {
        id: 1,
        amount: 1000,
        type: 'credit',
        description: 'Test Transaction',
        category: 'rent',
        accountId: 1,
        propertyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        account: {
          id: 1,
          name: 'Test Account',
          type: 'asset',
        },
        property: {
          id: 1,
          title: 'Test Property',
          address: 'Test Address',
        },
      };

      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await transactionService.getTransactionById(1);

      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw error if transaction not found', async () => {
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(transactionService.getTransactionById(999)).rejects.toThrow('Transaction not found');
    });
  });

  describe('getTransactionSummary', () => {
    it('should return transaction summary', async () => {
      const mockTransactions = [
        {
          id: 1,
          amount: 1000,
          type: 'credit',
          category: 'rent',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          amount: 500,
          type: 'debit',
          category: 'maintenance',
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 3,
          amount: 300,
          type: 'credit',
          category: 'rent',
          createdAt: new Date('2024-01-03'),
        },
      ];

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await transactionService.getTransactionSummary();

      expect(result).toEqual({
        totalTransactions: 3,
        totalCredits: 1300,
        totalDebits: 500,
        netAmount: 800,
        transactionsByCategory: {
          rent: 1300,
          maintenance: 500,
        },
        transactionsByMonth: [
          {
            month: '2024-01',
            credits: 1300,
            debits: 500,
            net: 800,
          },
        ],
      });
    });
  });
});