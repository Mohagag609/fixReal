import { AccountService } from '../../src/services/account.service';
import prisma from '../../src/config/db';

// Mock Prisma
jest.mock('../../src/config/db');

describe('AccountService', () => {
  let accountService: AccountService;

  beforeEach(() => {
    accountService = new AccountService();
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create a new account', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'asset' as const,
        description: 'Test Description',
        balance: 1000,
      };

      const mockAccount = {
        id: 1,
        ...accountData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.account.create as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.createAccount(accountData);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          name: accountData.name,
          type: accountData.type,
          description: accountData.description,
          balance: accountData.balance,
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should create account with default balance', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'asset' as const,
      };

      const mockAccount = {
        id: 1,
        ...accountData,
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.account.create as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.createAccount(accountData);

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          name: accountData.name,
          type: accountData.type,
          description: undefined,
          balance: 0,
        },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('getAllAccounts', () => {
    it('should return all active accounts', async () => {
      const mockAccounts = [
        {
          id: 1,
          name: 'Account 1',
          type: 'asset',
          balance: 1000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Account 2',
          type: 'liability',
          balance: 500,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await accountService.getAllAccounts();

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getAccountById', () => {
    it('should return account by id', async () => {
      const mockAccount = {
        id: 1,
        name: 'Test Account',
        type: 'asset',
        balance: 1000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        transactions: [],
      };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.getAccountById(1);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { transactions: true },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should throw error if account not found', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(accountService.getAccountById(999)).rejects.toThrow('Account not found');
    });
  });

  describe('getAccountBalance', () => {
    it('should calculate account balance correctly', async () => {
      const mockAccount = {
        id: 1,
        name: 'Test Account',
        type: 'asset',
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        transactions: [
          { id: 1, amount: 1000, type: 'credit' },
          { id: 2, amount: 300, type: 'debit' },
          { id: 3, amount: 200, type: 'credit' },
        ],
      };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.getAccountBalance(1);

      expect(result).toEqual({
        id: 1,
        name: 'Test Account',
        type: 'asset',
        balance: 900, // 1000 + 200 - 300
        description: undefined,
        isActive: true,
        createdAt: mockAccount.createdAt,
        updatedAt: mockAccount.updatedAt,
      });
    });
  });

  describe('getAccountSummary', () => {
    it('should return account summary', async () => {
      const mockAccounts = [
        {
          id: 1,
          type: 'asset',
          transactions: [
            { amount: 1000, type: 'credit' },
            { amount: 200, type: 'debit' },
          ],
        },
        {
          id: 2,
          type: 'liability',
          transactions: [
            { amount: 500, type: 'credit' },
            { amount: 100, type: 'debit' },
          ],
        },
        {
          id: 3,
          type: 'revenue',
          transactions: [
            { amount: 2000, type: 'credit' },
          ],
        },
        {
          id: 4,
          type: 'expense',
          transactions: [
            { amount: 800, type: 'debit' },
          ],
        },
      ];

      (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);

      const result = await accountService.getAccountSummary();

      expect(result).toEqual({
        totalAssets: 800, // 1000 - 200
        totalLiabilities: 400, // 500 - 100
        totalEquity: 0,
        totalRevenue: 2000,
        totalExpenses: 800,
        netWorth: 400, // 800 - 400
      });
    });
  });
});