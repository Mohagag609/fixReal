import { Request, Response } from 'express';
import { AccountService } from '../services/account.service';
import { CreateAccountData, UpdateAccountData } from '../models/account.model';

const accountService = new AccountService();

export class AccountController {
  async createAccount(req: Request, res: Response) {
    try {
      const data: CreateAccountData = req.body;
      const account = await accountService.createAccount(data);
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: account,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create account',
      });
    }
  }

  async getAllAccounts(req: Request, res: Response) {
    try {
      const accounts = await accountService.getAllAccounts();
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch accounts',
      });
    }
  }

  async getAccountById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required',
        });
      }
      const account = await accountService.getAccountById(parseInt(id));
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Account not found',
      });
    }
  }

  async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required',
        });
      }
      const data: UpdateAccountData = req.body;
      const account = await accountService.updateAccount(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Account updated successfully',
        data: account,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update account',
      });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required',
        });
      }
      await accountService.deleteAccount(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account',
      });
    }
  }

  async getAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required',
        });
      }
      const balance = await accountService.getAccountBalance(parseInt(id));
      res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Account not found',
      });
    }
  }

  async getAccountSummary(req: Request, res: Response) {
    try {
      const summary = await accountService.getAccountSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch account summary',
      });
    }
  }

  async getAccountsByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Account type is required',
        });
      }
      const accounts = await accountService.getAccountsByType(type);
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch accounts by type',
      });
    }
  }
}