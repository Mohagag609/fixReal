import prisma from '../config/db';
import { CreateTenantData, UpdateTenantData, TenantSummary } from '../models/tenant.model';

export class TenantService {
  async createTenant(data: CreateTenantData) {
    return prisma.tenant.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        idNumber: data.idNumber || null,
      },
    });
  }

  async getAllTenants() {
    return prisma.tenant.findMany({
      include: {
        contracts: {
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

  async getTenantById(id: number) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
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

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(id: number, data: UpdateTenantData) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async deleteTenant(id: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getActiveTenants() {
    return prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        contracts: {
          where: { status: 'active' },
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

  async getTenantSummary(): Promise<TenantSummary> {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        contracts: {
          where: { status: 'active' },
        },
        payments: {
          where: { status: 'completed' },
        },
      },
    });

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.contracts.length > 0).length;
    const totalRentPaid = tenants.reduce((sum, tenant) => {
      return sum + tenant.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);
    const averageRentAmount = activeTenants > 0 ? totalRentPaid / activeTenants : 0;

    return {
      totalTenants,
      activeTenants,
      totalRentPaid,
      averageRentAmount,
    };
  }

  async searchTenants(query: string) {
    return prisma.tenant.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
              { idNumber: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        contracts: {
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

  async getTenantRentHistory(tenantId: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return prisma.payment.findMany({
      where: {
        tenantId,
        status: 'completed',
      },
      include: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantContracts(tenantId: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

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
}