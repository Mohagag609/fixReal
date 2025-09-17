import { Request, Response } from 'express';
import { AccountController } from '../../src/controllers/account.controller';
import { AccountService } from '../../src/services/account.service';

// Mock AccountService
jest.mock('../../src/services/account.service');
const MockedAccountService = AccountService as jest.MockedClass<typeof AccountService>;

describe('AccountController', () => {
  let accountController: AccountController;
  let mockAccountService: jest.Mocked<AccountService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    accountController = new AccountController();
    mockAccountService = new MockedAccountService() as jest.Mocked<AccountService>;
    (AccountController as any).prototype.accountService = mockAccountService;

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'asset' as const,
        description: 'Test Description',
      };

      const mockAccount = {
        id: 1,
        ...accountData,
        balance: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = accountData;
      mockAccountService.createAccount.mockResolvedValue(mockAccount);

      await accountController.createAccount(mockRequest as Request, mockResponse as Response);

      expect(mockAccountService.createAccount).toHaveBeenCalledWith(accountData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account created successfully',
        data: mockAccount,
      });
    });

    it('should handle creation error', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'asset' as const,
      };

      mockRequest.body = accountData;
      mockAccountService.createAccount.mockRejectedValue(new Error('Database error'));

      await accountController.createAccount(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
      });
    });
  });

  describe('getAllAccounts', () => {
    it('should return all accounts', async () => {
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
      ];

      mockAccountService.getAllAccounts.mockResolvedValue(mockAccounts);

      await accountController.getAllAccounts(mockRequest as Request, mockResponse as Response);

      expect(mockAccountService.getAllAccounts).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccounts,
      });
    });

    it('should handle service error', async () => {
      mockAccountService.getAllAccounts.mockRejectedValue(new Error('Service error'));

      await accountController.getAllAccounts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Service error',
      });
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

      mockRequest.params = { id: '1' };
      mockAccountService.getAccountById.mockResolvedValue(mockAccount);

      await accountController.getAccountById(mockRequest as Request, mockResponse as Response);

      expect(mockAccountService.getAccountById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAccount,
      });
    });

    it('should handle account not found', async () => {
      mockRequest.params = { id: '999' };
      mockAccountService.getAccountById.mockRejectedValue(new Error('Account not found'));

      await accountController.getAccountById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account not found',
      });
    });
  });

  describe('getAccountBalance', () => {
    it('should return account balance', async () => {
      const mockBalance = {
        id: 1,
        name: 'Test Account',
        type: 'asset',
        balance: 1000,
        description: undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockAccountService.getAccountBalance.mockResolvedValue(mockBalance);

      await accountController.getAccountBalance(mockRequest as Request, mockResponse as Response);

      expect(mockAccountService.getAccountBalance).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBalance,
      });
    });
  });

  describe('getAccountSummary', () => {
    it('should return account summary', async () => {
      const mockSummary = {
        totalAssets: 10000,
        totalLiabilities: 5000,
        totalEquity: 2000,
        totalRevenue: 8000,
        totalExpenses: 3000,
        netWorth: 5000,
      };

      mockAccountService.getAccountSummary.mockResolvedValue(mockSummary);

      await accountController.getAccountSummary(mockRequest as Request, mockResponse as Response);

      expect(mockAccountService.getAccountSummary).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSummary,
      });
    });
  });
});