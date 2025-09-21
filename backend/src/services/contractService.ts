import prisma from '../config/database';
import { Contract, ContractCreateRequest, ContractUpdateRequest, SearchQuery } from '../types';

export class ContractService {
  /**
   * Get all contracts with pagination and search
   */
  static async getAllContracts(query: SearchQuery): Promise<{
    contracts: Contract[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { brokerName: { contains: search, mode: 'insensitive' } },
        { unit: { name: { contains: search, mode: 'insensitive' } } },
        { unit: { code: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get contracts and total count
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          unit: true,
          customer: true
        }
      }),
      prisma.contract.count({ where })
    ]);

    return {
      contracts: contracts.map(contract => ({
        ...contract,
        start: contract.start.toISOString(),
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
        deletedAt: contract.deletedAt?.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get contract by ID
   */
  static async getContractById(id: string): Promise<Contract | null> {
    const contract = await prisma.contract.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: true,
        customer: true
      }
    });

    if (!contract) return null;

    return {
      ...contract,
      start: contract.start.toISOString(),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      deletedAt: contract.deletedAt?.toISOString()
    };
  }

  /**
   * Create new contract
   */
  static async createContract(data: ContractCreateRequest): Promise<Contract> {
    // Validate unit exists and is available
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId, deletedAt: null }
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    if (unit.status !== 'متاحة') {
      throw new Error('Unit is not available');
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId, deletedAt: null }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        unitId: data.unitId,
        customerId: data.customerId,
        start: new Date(data.start),
        totalPrice: data.totalPrice,
        discountAmount: data.discountAmount || 0,
        brokerName: data.brokerName,
        brokerPercent: data.brokerPercent || 0,
        brokerAmount: data.brokerAmount || 0,
        commissionSafeId: data.commissionSafeId,
        downPaymentSafeId: data.downPaymentSafeId,
        maintenanceDeposit: data.maintenanceDeposit || 0,
        installmentType: data.installmentType || 'شهري',
        installmentCount: data.installmentCount || 0,
        extraAnnual: data.extraAnnual || 0,
        annualPaymentValue: data.annualPaymentValue || 0,
        downPayment: data.downPayment || 0,
        paymentType: data.paymentType || 'installment'
      },
      include: {
        unit: true,
        customer: true
      }
    });

    // Update unit status to reserved
    await prisma.unit.update({
      where: { id: data.unitId },
      data: { status: 'محجوزة' }
    });

    // Generate installments if installment type
    if (data.paymentType === 'installment' && data.installmentCount > 0) {
      await this.generateInstallments(contract.id, data);
    }

    return {
      ...contract,
      start: contract.start.toISOString(),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      deletedAt: contract.deletedAt?.toISOString()
    };
  }

  /**
   * Update contract
   */
  static async updateContract(id: string, data: ContractUpdateRequest): Promise<Contract | null> {
    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingContract) return null;

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...(data.unitId && { unitId: data.unitId }),
        ...(data.customerId && { customerId: data.customerId }),
        ...(data.start && { start: new Date(data.start) }),
        ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
        ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount }),
        ...(data.brokerName !== undefined && { brokerName: data.brokerName }),
        ...(data.brokerPercent !== undefined && { brokerPercent: data.brokerPercent }),
        ...(data.brokerAmount !== undefined && { brokerAmount: data.brokerAmount }),
        ...(data.commissionSafeId !== undefined && { commissionSafeId: data.commissionSafeId }),
        ...(data.downPaymentSafeId !== undefined && { downPaymentSafeId: data.downPaymentSafeId }),
        ...(data.maintenanceDeposit !== undefined && { maintenanceDeposit: data.maintenanceDeposit }),
        ...(data.installmentType && { installmentType: data.installmentType }),
        ...(data.installmentCount !== undefined && { installmentCount: data.installmentCount }),
        ...(data.extraAnnual !== undefined && { extraAnnual: data.extraAnnual }),
        ...(data.annualPaymentValue !== undefined && { annualPaymentValue: data.annualPaymentValue }),
        ...(data.downPayment !== undefined && { downPayment: data.downPayment }),
        ...(data.paymentType && { paymentType: data.paymentType })
      },
      include: {
        unit: true,
        customer: true
      }
    });

    return {
      ...contract,
      start: contract.start.toISOString(),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      deletedAt: contract.deletedAt?.toISOString()
    };
  }

  /**
   * Delete contract (soft delete)
   */
  static async deleteContract(id: string): Promise<boolean> {
    const contract = await prisma.contract.findUnique({
      where: { id, deletedAt: null }
    });

    if (!contract) return false;

    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Update unit status back to available
    await prisma.unit.update({
      where: { id: contract.unitId },
      data: { status: 'متاحة' }
    });

    return true;
  }

  /**
   * Get contract installments
   */
  static async getContractInstallments(contractId: string): Promise<any[]> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      include: { unit: true }
    });

    if (!contract) return [];

    const installments = await prisma.installment.findMany({
      where: {
        unitId: contract.unitId,
        deletedAt: null
      },
      orderBy: { dueDate: 'asc' }
    });

    return installments.map(installment => ({
      ...installment,
      dueDate: installment.dueDate.toISOString(),
      createdAt: installment.createdAt.toISOString(),
      updatedAt: installment.updatedAt.toISOString(),
      deletedAt: installment.deletedAt?.toISOString()
    }));
  }

  /**
   * Get contract statistics
   */
  static async getContractStats(contractId: string): Promise<{
    totalValue: number;
    paidAmount: number;
    pendingAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    pendingInstallments: number;
    overdueInstallments: number;
  }> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      include: { unit: true }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    const [installments, vouchers] = await Promise.all([
      prisma.installment.findMany({
        where: { unitId: contract.unitId, deletedAt: null }
      }),
      prisma.voucher.findMany({
        where: {
          linkedRef: contract.unitId,
          deletedAt: null,
          type: 'receipt'
        }
      })
    ]);

    const totalValue = contract.totalPrice;
    const paidAmount = vouchers.reduce((sum, voucher) => sum + voucher.amount, 0);
    const pendingAmount = totalValue - paidAmount;
    const totalInstallments = installments.length;
    const paidInstallments = installments.filter(i => i.status === 'مدفوع').length;
    const pendingInstallments = installments.filter(i => i.status === 'معلق').length;
    const overdueInstallments = installments.filter(i => 
      i.status === 'معلق' && i.dueDate < new Date()
    ).length;

    return {
      totalValue,
      paidAmount,
      pendingAmount,
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      overdueInstallments
    };
  }

  /**
   * Generate installments for contract
   */
  private static async generateInstallments(contractId: string, data: ContractCreateRequest): Promise<void> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { unit: true }
    });

    if (!contract) return;

    const installmentAmount = (contract.totalPrice - (data.downPayment || 0)) / (data.installmentCount || 1);
    const startDate = new Date(data.start);
    const installments = [];

    for (let i = 0; i < (data.installmentCount || 1); i++) {
      const dueDate = new Date(startDate);
      
      if (data.installmentType === 'شهري') {
        dueDate.setMonth(dueDate.getMonth() + i + 1);
      } else if (data.installmentType === 'ربع سنوي') {
        dueDate.setMonth(dueDate.getMonth() + (i + 1) * 3);
      } else if (data.installmentType === 'نصف سنوي') {
        dueDate.setMonth(dueDate.getMonth() + (i + 1) * 6);
      } else if (data.installmentType === 'سنوي') {
        dueDate.setFullYear(dueDate.getFullYear() + i + 1);
      }

      installments.push({
        unitId: contract.unitId,
        amount: installmentAmount,
        dueDate,
        status: 'معلق'
      });
    }

    await prisma.installment.createMany({
      data: installments
    });
  }

  /**
   * Generate contract PDF
   */
  static async generateContractPDF(contractId: string): Promise<Buffer> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      include: {
        unit: true,
        customer: true
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // This would integrate with a PDF generation library like puppeteer or pdfkit
    // For now, return a simple text representation
    const contractText = `
      عقد بيع وحدة عقارية
      ===================
      
      العميل: ${contract.customer.name}
      الوحدة: ${contract.unit.name || contract.unit.code}
      السعر الإجمالي: ${contract.totalPrice} ج.م
      تاريخ العقد: ${contract.start.toLocaleDateString('ar-EG')}
      نوع الدفع: ${contract.paymentType}
      عدد الأقساط: ${contract.installmentCount}
    `;

    return Buffer.from(contractText, 'utf-8');
  }

  /**
   * Search contracts
   */
  static async searchContracts(searchTerm: string): Promise<Contract[]> {
    const contracts = await prisma.contract.findMany({
      where: {
        deletedAt: null,
        OR: [
          { brokerName: { contains: searchTerm, mode: 'insensitive' } },
          { unit: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { unit: { code: { contains: searchTerm, mode: 'insensitive' } } },
          { customer: { name: { contains: searchTerm, mode: 'insensitive' } } }
        ]
      },
      include: {
        unit: true,
        customer: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return contracts.map(contract => ({
      ...contract,
      start: contract.start.toISOString(),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      deletedAt: contract.deletedAt?.toISOString()
    }));
  }
}