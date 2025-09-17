import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentData, UpdatePaymentData } from '../models/payment.model';

const paymentService = new PaymentService();

export class PaymentController {
  async createPayment(req: Request, res: Response) {
    try {
      const data: CreatePaymentData = req.body;
      const payment = await paymentService.createPayment(data);
      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment',
      });
    }
  }

  async getAllPayments(req: Request, res: Response) {
    try {
      const payments = await paymentService.getAllPayments();
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch payments',
      });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }
      const payment = await paymentService.getPaymentById(parseInt(id));
      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Payment not found',
      });
    }
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }
      const data: UpdatePaymentData = req.body;
      const payment = await paymentService.updatePayment(parseInt(id), data);
      res.status(200).json({
        success: true,
        message: 'Payment updated successfully',
        data: payment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update payment',
      });
    }
  }

  async deletePayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
      }
      await paymentService.deletePayment(parseInt(id));
      res.status(200).json({
        success: true,
        message: 'Payment deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete payment',
      });
    }
  }

  async getPaymentsByInvoice(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required',
        });
      }
      const payments = await paymentService.getPaymentsByInvoice(parseInt(invoiceId));
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch payments by invoice',
      });
    }
  }

  async getPaymentsByContract(req: Request, res: Response) {
    try {
      const { contractId } = req.params;
      if (!contractId) {
        return res.status(400).json({
          success: false,
          message: 'Contract ID is required',
        });
      }
      const payments = await paymentService.getPaymentsByContract(parseInt(contractId));
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch payments by contract',
      });
    }
  }

  async getPaymentsByTenant(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required',
        });
      }
      const payments = await paymentService.getPaymentsByTenant(parseInt(tenantId));
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch payments by tenant',
      });
    }
  }

  async getPaymentSummary(req: Request, res: Response) {
    try {
      const summary = await paymentService.getPaymentSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch payment summary',
      });
    }
  }
}