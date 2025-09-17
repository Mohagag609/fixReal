import { Request, Response } from 'express';
import { ContractService } from '../services/contract.service';
import { CreateContractData, UpdateContractData } from '../models/contract.model';

const contractService = new ContractService();

export class ContractController {
  async createContract(req: Request, res: Response) {
    try {
      const data: CreateContractData = req.body;
      const contract = await contractService.createContract(data);
      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create contract',
      });
    }
  }

  async getAllContracts(req: Request, res: Response) {
    try {
      const contracts = await contractService.getAllContracts();
      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch contracts',
      });
    }
  }

  async getContractById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Contract ID is required',
        });
      }
      const contract = await contractService.getContractById(parseInt(id));
      res.status(200).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Contract not found',
      });
    }
  }

  async updateContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Contract ID is required',
        });
      }
      const data: UpdateContractData = req.body;
      const contract = await contractService.updateContract(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Contract updated successfully',
        data: contract,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update contract',
      });
    }
  }

  async deleteContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Contract ID is required',
        });
      }
      await contractService.deleteContract(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Contract deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete contract',
      });
    }
  }

  async getContractsByProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      const contracts = await contractService.getContractsByProperty(parseInt(propertyId));
      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch contracts by property',
      });
    }
  }

  async getContractsByTenant(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      const contracts = await contractService.getContractsByTenant(parseInt(tenantId));
      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch contracts by tenant',
      });
    }
  }

  async getActiveContracts(req: Request, res: Response) {
    try {
      const contracts = await contractService.getActiveContracts();
      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch active contracts',
      });
    }
  }

  async getExpiredContracts(req: Request, res: Response) {
    try {
      const contracts = await contractService.getExpiredContracts();
      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expired contracts',
      });
    }
  }

  async getContractSummary(req: Request, res: Response) {
    try {
      const summary = await contractService.getContractSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch contract summary',
      });
    }
  }

  async renewContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Contract ID is required',
        });
      }
      const { newEndDate } = req.body;
      if (!newEndDate) {
        return res.status(400).json({
          success: false,
          message: 'New end date is required',
        });
      }
      const contract = await contractService.renewContract(parseInt(id), new Date(newEndDate));
      res.status(200).json({
        success: true,
        message: 'Contract renewed successfully',
        data: contract,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to renew contract',
      });
    }
  }

  async terminateContract(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Contract ID is required',
        });
      }
      const contract = await contractService.terminateContract(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Contract terminated successfully',
        data: contract,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to terminate contract',
      });
    }
  }
}