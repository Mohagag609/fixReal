import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceData, UpdateInvoiceData } from '../models/invoice.model';

const invoiceService = new InvoiceService();

export class InvoiceController {
  async createInvoice(req: Request, res: Response) {
    try {
      const data: CreateInvoiceData = req.body;
      const invoice = await invoiceService.createInvoice(data);
      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create invoice',
      });
    }
  }

  async getAllInvoices(req: Request, res: Response) {
    try {
      const invoices = await invoiceService.getAllInvoices();
      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch invoices',
      });
    }
  }

  async getInvoiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      const invoice = await invoiceService.getInvoiceById(parseInt(id));
      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invoice not found',
      });
    }
  }

  async updateInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      const data: UpdateInvoiceData = req.body;
      const invoice = await invoiceService.updateInvoice(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update invoice',
      });
    }
  }

  async deleteInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      await invoiceService.deleteInvoice(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete invoice',
      });
    }
  }

  async getInvoicesByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }
      const invoices = await invoiceService.getInvoicesByStatus(status);
      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch invoices by status',
      });
    }
  }

  async getOverdueInvoices(req: Request, res: Response) {
    try {
      const invoices = await invoiceService.getOverdueInvoices();
      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch overdue invoices',
      });
    }
  }

  async getInvoicesByProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required',
        });
      }
      const invoices = await invoiceService.getInvoicesByProperty(parseInt(propertyId));
      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch invoices by property',
      });
    }
  }

  async getInvoiceSummary(req: Request, res: Response) {
    try {
      const summary = await invoiceService.getInvoiceSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch invoice summary',
      });
    }
  }

  async markInvoiceAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      const invoice = await invoiceService.markInvoiceAsPaid(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Invoice marked as paid successfully',
        data: invoice,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark invoice as paid',
      });
    }
  }

  async markInvoiceAsOverdue(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      const invoice = await invoiceService.markInvoiceAsOverdue(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Invoice marked as overdue successfully',
        data: invoice,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark invoice as overdue',
      });
    }
  }

  async generateInvoiceNumber(req: Request, res: Response) {
    try {
      const invoiceNumber = await invoiceService.generateInvoiceNumber();
      res.status(200).json({
        success: true,
        data: { invoiceNumber },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate invoice number',
      });
    }
  }
}