import prisma from '../config/db';
import { CreateContractData, UpdateContractData, ContractSummary } from '../models/contract.model';

export class ContractService {
  async createContract(data: CreateContractData) {
    return prisma.contract.create({
      data: {
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate || null,
        rentAmount: data.rentAmount || null,
        salePrice: data.salePrice || null,
        propertyId: data.propertyId,
        tenantId: data.tenantId || null,
      },
    });
  }

  async getAllContracts() {
    return prisma.contract.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

  async getContractById(id: number) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  async updateContract(id: number, data: UpdateContractData) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    return prisma.contract.update({
      where: { id },
      data,
    });
  }

  async deleteContract(id: number) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    return prisma.contract.delete({ where: { id } });
  }

  async getContractsByProperty(propertyId: number) {
    return prisma.contract.findMany({
      where: { propertyId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

  async getContractsByTenant(tenantId: number) {
    return prisma.contract.findMany({
      where: { tenantId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

  async getActiveContracts() {
    return prisma.contract.findMany({
      where: { status: 'active' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

  async getExpiredContracts() {
    const now = new Date();
    return prisma.contract.findMany({
      where: {
        status: 'active',
        endDate: {
          lt: now,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
      orderBy: { endDate: 'asc' },
    });
  }

  async getContractSummary(): Promise<ContractSummary> {
    const contracts = await prisma.contract.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const expiredContracts = contracts.filter(c => c.status === 'expired').length;
    const totalRentIncome = contracts
      .filter(c => c.type === 'rent' && c.status === 'active')
      .reduce((sum, c) => sum + (c.rentAmount || 0), 0);
    const totalSalesRevenue = contracts
      .filter(c => c.type === 'sale' && c.status === 'active')
      .reduce((sum, c) => sum + (c.salePrice || 0), 0);

    return {
      totalContracts,
      activeContracts,
      expiredContracts,
      totalRentIncome,
      totalSalesRevenue,
    };
  }

  async renewContract(id: number, newEndDate: Date) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    return prisma.contract.update({
      where: { id },
      data: {
        endDate: newEndDate,
        status: 'active',
      },
    });
  }

  async terminateContract(id: number) {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new Error('Contract not found');
    }

    return prisma.contract.update({
      where: { id },
      data: {
        status: 'terminated',
        endDate: new Date(),
      },
    });
  }
}