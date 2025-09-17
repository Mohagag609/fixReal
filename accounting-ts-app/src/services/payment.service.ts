import prisma from '../config/db';
import { CreatePaymentData, UpdatePaymentData, PaymentSummary } from '../models/payment.model';

export class PaymentService {
  async createPayment(data: CreatePaymentData) {
    return prisma.$transaction(async (tx) => {
      // Create the payment
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          reference: data.reference || null,
          invoiceId: data.invoiceId || null,
          contractId: data.contractId || null,
          tenantId: data.tenantId || null,
        },
      });

      // Update invoice status if payment is for an invoice
      if (data.invoiceId) {
        await this.updateInvoiceStatus(tx, data.invoiceId);
      }

      // Create transaction record
      if (data.contractId) {
        const contract = await tx.contract.findUnique({
          where: { id: data.contractId },
          include: { property: true },
        });

        if (contract) {
          await tx.transaction.create({
            data: {
              amount: data.amount,
              type: 'credit',
              description: `Payment received for ${contract.property.title}`,
              category: 'rent',
              accountId: contract.property.accountId,
              propertyId: contract.propertyId,
            },
          });
        }
      }

      return payment;
    });
  }

  async getAllPayments() {
    return prisma.payment.findMany({
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: true,
            total: true,
          },
        },
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(id: number) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: true,
            total: true,
          },
        },
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  async updatePayment(id: number, data: UpdatePaymentData) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new Error('Payment not found');
    }

    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  async deletePayment(id: number) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new Error('Payment not found');
    }

    return prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      // Update invoice status if payment was for an invoice
      if (payment.invoiceId) {
        await this.updateInvoiceStatus(tx, payment.invoiceId);
      }
    });
  }

  async getPaymentsByInvoice(invoiceId: number) {
    return prisma.payment.findMany({
      where: { invoiceId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: true,
            total: true,
          },
        },
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentsByContract(contractId: number) {
    return prisma.payment.findMany({
      where: { contractId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: true,
            total: true,
          },
        },
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentsByTenant(tenantId: number) {
    return prisma.payment.findMany({
      where: { tenantId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: true,
            total: true,
          },
        },
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentSummary(): Promise<PaymentSummary> {
    const payments = await prisma.payment.findMany();

    const totalPayments = payments.length;
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Group by method
    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Group by month
    const paymentsByMonth = payments.reduce((acc, payment) => {
      const month = payment.createdAt.toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, amount: 0, count: 0 };
      }
      acc[month].amount += payment.amount;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string; amount: number; count: number }>);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      paymentsByMethod,
      paymentsByMonth: Object.values(paymentsByMonth).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  private async updateInvoiceStatus(tx: any, invoiceId: number) {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: { where: { status: 'completed' } } },
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    let status = 'unpaid';

    if (totalPaid >= invoice.total) {
      status = 'paid';
    } else if (invoice.dueDate < new Date()) {
      status = 'overdue';
    }

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });
  }
}