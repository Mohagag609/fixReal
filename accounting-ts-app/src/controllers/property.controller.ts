import { Request, Response } from 'express';
import { PropertyService } from '../services/property.service';
import { CreatePropertyData, UpdatePropertyData } from '../models/property.model';

const propertyService = new PropertyService();

export class PropertyController {
  async createProperty(req: Request, res: Response) {
    try {
      const data: CreatePropertyData = req.body;
      const property = await propertyService.createProperty(data);
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create property',
      });
    }
  }

  async getAllProperties(req: Request, res: Response) {
    try {
      const properties = await propertyService.getAllProperties();
      res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch properties',
      });
    }
  }

  async getPropertyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      const property = await propertyService.getPropertyById(parseInt(id));
      res.status(200).json({
        success: true,
        data: property,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Property not found',
      });
    }
  }

  async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      const data: UpdatePropertyData = req.body;
      const property = await propertyService.updateProperty(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Property updated successfully',
        data: property,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update property',
      });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      await propertyService.deleteProperty(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete property',
      });
    }
  }

  async getPropertiesByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }
      const properties = await propertyService.getPropertiesByStatus(status);
      res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch properties by status',
      });
    }
  }

  async getPropertiesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Type is required',
        });
      }
      const properties = await propertyService.getPropertiesByType(type);
      res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch properties by type',
      });
    }
  }

  async getPropertySummary(req: Request, res: Response) {
    try {
      const summary = await propertyService.getPropertySummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch property summary',
      });
    }
  }

  async searchProperties(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }
      const properties = await propertyService.searchProperties(q);
      res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search properties',
      });
    }
  }
}