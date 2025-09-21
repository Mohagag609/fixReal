import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';
import { ApiResponse, AuthenticatedRequest } from '../types';

export class ReportController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const stats = await ReportService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get dashboard statistics'
      } as ApiResponse);
    }
  }

  /**
   * Get financial summary
   */
  static async getFinancialSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { startDate, endDate } = req.query;
      const summary = await ReportService.getFinancialSummary(
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: summary,
        message: 'Financial summary retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get financial summary'
      } as ApiResponse);
    }
  }

  /**
   * Get sales report
   */
  static async getSalesReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { startDate, endDate, groupBy } = req.query;
      const report = await ReportService.getSalesReport(
        startDate as string,
        endDate as string,
        groupBy as string
      );

      res.status(200).json({
        success: true,
        data: report,
        message: 'Sales report retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get sales report'
      } as ApiResponse);
    }
  }

  /**
   * Get customer report
   */
  static async getCustomerReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { startDate, endDate } = req.query;
      const report = await ReportService.getCustomerReport(
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: report,
        message: 'Customer report retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get customer report'
      } as ApiResponse);
    }
  }

  /**
   * Get unit report
   */
  static async getUnitReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { startDate, endDate } = req.query;
      const report = await ReportService.getUnitReport(
        startDate as string,
        endDate as string
      );

      res.status(200).json({
        success: true,
        data: report,
        message: 'Unit report retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get unit report'
      } as ApiResponse);
    }
  }

  /**
   * Get installment report
   */
  static async getInstallmentReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { startDate, endDate, status } = req.query;
      const report = await ReportService.getInstallmentReport(
        startDate as string,
        endDate as string,
        status as string
      );

      res.status(200).json({
        success: true,
        data: report,
        message: 'Installment report retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get installment report'
      } as ApiResponse);
    }
  }

  /**
   * Get safe report
   */
  static async getSafeReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { startDate, endDate, safeId } = req.query;
      const report = await ReportService.getSafeReport(
        startDate as string,
        endDate as string,
        safeId as string
      );

      res.status(200).json({
        success: true,
        data: report,
        message: 'Safe report retrieved successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to get safe report'
      } as ApiResponse);
    }
  }

  /**
   * Export report to PDF
   */
  static async exportReportPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { reportType, startDate, endDate } = req.query;
      const pdfBuffer = await ReportService.exportReportPDF(
        reportType as string,
        startDate as string,
        endDate as string
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to export report PDF'
      } as ApiResponse);
    }
  }

  /**
   * Export report to Excel
   */
  static async exportReportExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        } as ApiResponse);
        return;
      }

      const { reportType, startDate, endDate } = req.query;
      const excelBuffer = await ReportService.exportReportExcel(
        reportType as string,
        startDate as string,
        endDate as string
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to export report Excel'
      } as ApiResponse);
    }
  }
}