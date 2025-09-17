import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { CreateTenantData, UpdateTenantData } from '../models/tenant.model';

const tenantService = new TenantService();

export class TenantController {
  async createTenant(req: Request, res: Response) {
    try {
      const data: CreateTenantData = req.body;
      const tenant = await tenantService.createTenant(data);
      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: tenant,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create tenant',
      });
    }
  }

  async getAllTenants(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getAllTenants();
      res.status(200).json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch tenants',
      });
    }
  }

  async getTenantById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      const tenant = await tenantService.getTenantById(parseInt(id));
      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Tenant not found',
      });
    }
  }

  async updateTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      const data: UpdateTenantData = req.body;
      const tenant = await tenantService.updateTenant(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        data: tenant,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update tenant',
      });
    }
  }

  async deleteTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      await tenantService.deleteTenant(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete tenant',
      });
    }
  }

  async getActiveTenants(req: Request, res: Response) {
    try {
      const tenants = await tenantService.getActiveTenants();
      res.status(200).json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch active tenants',
      });
    }
  }

  async getTenantSummary(req: Request, res: Response) {
    try {
      const summary = await tenantService.getTenantSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch tenant summary',
      });
    }
  }

  async searchTenants(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }
      const tenants = await tenantService.searchTenants(q);
      res.status(200).json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search tenants',
      });
    }
  }

  async getTenantRentHistory(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      const history = await tenantService.getTenantRentHistory(parseInt(tenantId));
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Tenant not found',
      });
    }
  }

  async getTenantContracts(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      const contracts = await tenantService.getTenantContracts(parseInt(tenantId));
      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Tenant not found',
      });
    }
  }
}