import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { CreateReportData } from '../models/report.model';

const reportService = new ReportService();

export class ReportController {
  async createReport(req: Request, res: Response) {
    try {
      const data: CreateReportData = req.body;
      const report = await reportService.createReport(data);
      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: report,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create report',
      });
    }
  }

  async getAllReports(req: Request, res: Response) {
    try {
      const reports = await reportService.getAllReports();
      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch reports',
      });
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Report ID is required',
        });
      }
      const report = await reportService.getReportById(parseInt(id));
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Report not found',
      });
    }
  }

  async getReportsByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Report type is required',
        });
      }
      const reports = await reportService.getReportsByType(type);
      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch reports by type',
      });
    }
  }

  async generateFinancialReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }
      const report = await reportService.generateFinancialReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate financial report',
      });
    }
  }

  async generatePropertyReport(req: Request, res: Response) {
    try {
      const report = await reportService.generatePropertyReport();
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate property report',
      });
    }
  }

  async generateTenantReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateTenantReport();
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate tenant report',
      });
    }
  }

  async generateRevenueReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }
      const report = await reportService.generateRevenueReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate revenue report',
      });
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Report ID is required',
        });
      }
      await reportService.deleteReport(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete report',
      });
    }
  }
}