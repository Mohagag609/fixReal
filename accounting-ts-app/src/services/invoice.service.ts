import prisma from '../config/db';
import { CreateInvoiceData, UpdateInvoiceData, InvoiceSummary } from '../models/invoice.model';

export class InvoiceService {
  async createInvoice(data: CreateInvoiceData) {
    const total = data.total || (data.amount + (data.tax || 0));
    
    return prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        customer: data.customer,
        amount: data.amount,
        tax: data.tax || 0,
        total,
        dueDate: data.dueDate,
        description: data.description || null,
        propertyId: data.propertyId || null,
      },
    });
  }

  async getAllInvoices() {
    return prisma.invoice.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: number) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(id: number, data: UpdateInvoiceData) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const total = data.total || (data.amount || invoice.amount) + (data.tax || invoice.tax);

    return prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        total,
      },
    });
  }

  async deleteInvoice(id: number) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return prisma.invoice.delete({ where: { id } });
  }

  async getInvoicesByStatus(status: string) {
    return prisma.invoice.findMany({
      where: { status },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOverdueInvoices() {
    const now = new Date();
    return prisma.invoice.findMany({
      where: {
        status: 'unpaid',
        dueDate: {
          lt: now,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getInvoicesByProperty(propertyId: number) {
    return prisma.invoice.findMany({
      where: { propertyId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceSummary(): Promise<InvoiceSummary> {
    const invoices = await prisma.invoice.findMany({
      include: {
        payments: {
          where: { status: 'completed' },
        },
      },
    });

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const unpaidInvoices = invoices.filter(i => i.status === 'unpaid').length;
    const overdueInvoices = invoices.filter(i => {
      return i.status === 'unpaid' && i.dueDate < new Date();
    }).length;

    const totalAmount = invoices.reduce((sum, i) => sum + i.total, 0);
    const paidAmount = invoices.reduce((sum, i) => {
      return sum + i.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);
    const outstandingAmount = totalAmount - paidAmount;

    return {
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      totalAmount,
      paidAmount,
      outstandingAmount,
    };
  }

  async markInvoiceAsPaid(id: number) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'paid' },
    });
  }

  async markInvoiceAsOverdue(id: number) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'overdue' },
    });
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}${month}`,
        },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
      nextNumber = lastNumber + 1;
    }

    return `INV-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
  }
}