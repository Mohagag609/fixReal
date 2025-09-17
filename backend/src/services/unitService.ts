import prisma from '../config/database';
import { Unit, UnitCreateRequest, UnitUpdateRequest, SearchQuery } from '../types';

export class UnitService {
  /**
   * Get all units with pagination and search
   */
  static async getAllUnits(query: SearchQuery): Promise<{
    units: Unit[];
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
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
        { floor: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get units and total count
    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.unit.count({ where })
    ]);

    return {
      units: units.map(unit => ({
        ...unit,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
        deletedAt: unit.deletedAt?.toISOString()
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
   * Get unit by ID
   */
  static async getUnitById(id: string): Promise<Unit | null> {
    const unit = await prisma.unit.findUnique({
      where: { id, deletedAt: null },
      include: {
        contracts: {
          where: { deletedAt: null },
          include: {
            customer: true
          }
        },
        installments: {
          where: { deletedAt: null }
        },
        unitPartners: {
          where: { deletedAt: null },
          include: {
            partner: true
          }
        }
      }
    });

    if (!unit) return null;

    return {
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    };
  }

  /**
   * Create new unit
   */
  static async createUnit(data: UnitCreateRequest): Promise<Unit> {
    // Check for duplicate code
    const existingUnit = await prisma.unit.findFirst({
      where: {
        code: data.code,
        deletedAt: null
      }
    });

    if (existingUnit) {
      throw new Error('Unit with this code already exists');
    }

    const unit = await prisma.unit.create({
      data: {
        code: data.code,
        name: data.name,
        unitType: data.unitType || 'سكني',
        area: data.area,
        floor: data.floor,
        building: data.building,
        totalPrice: data.totalPrice || 0,
        status: data.status || 'متاحة',
        notes: data.notes
      }
    });

    return {
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    };
  }

  /**
   * Update unit
   */
  static async updateUnit(id: string, data: UnitUpdateRequest): Promise<Unit | null> {
    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingUnit) return null;

    // Check for duplicate code (excluding current unit)
    if (data.code) {
      const duplicateUnit = await prisma.unit.findFirst({
        where: {
          code: data.code,
          deletedAt: null,
          id: { not: id }
        }
      });

      if (duplicateUnit) {
        throw new Error('Unit with this code already exists');
      }
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unitType && { unitType: data.unitType }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.floor !== undefined && { floor: data.floor }),
        ...(data.building !== undefined && { building: data.building }),
        ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    return {
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    };
  }

  /**
   * Delete unit (soft delete)
   */
  static async deleteUnit(id: string): Promise<boolean> {
    const unit = await prisma.unit.findUnique({
      where: { id, deletedAt: null }
    });

    if (!unit) return false;

    await prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Get unit contracts
   */
  static async getUnitContracts(unitId: string): Promise<any[]> {
    const contracts = await prisma.contract.findMany({
      where: {
        unitId,
        deletedAt: null
      },
      include: {
        customer: true,
        unit: true
      },
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

  /**
   * Get unit statistics
   */
  static async getUnitStats(unitId: string): Promise<{
    totalContracts: number;
    totalRevenue: number;
    totalInstallments: number;
    paidInstallments: number;
    pendingInstallments: number;
    lastContractDate?: string;
  }> {
    const [contracts, installments, vouchers] = await Promise.all([
      prisma.contract.findMany({
        where: { unitId, deletedAt: null }
      }),
      prisma.installment.findMany({
        where: { unitId, deletedAt: null }
      }),
      prisma.voucher.findMany({
        where: {
          linkedRef: unitId,
          deletedAt: null,
          type: 'receipt'
        }
      })
    ]);

    const totalContracts = contracts.length;
    const totalRevenue = vouchers.reduce((sum, voucher) => sum + voucher.amount, 0);
    const totalInstallments = installments.length;
    const paidInstallments = installments.filter(i => i.status === 'مدفوع').length;
    const pendingInstallments = installments.filter(i => i.status === 'معلق').length;
    const lastContractDate = contracts.length > 0 
      ? contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString()
      : undefined;

    return {
      totalContracts,
      totalRevenue,
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      lastContractDate
    };
  }

  /**
   * Get units by type
   */
  static async getUnitsByType(type: string): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      where: {
        unitType: type,
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });

    return units.map(unit => ({
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    }));
  }

  /**
   * Search units
   */
  static async searchUnits(searchTerm: string): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      where: {
        deletedAt: null,
        OR: [
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { building: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { code: 'asc' }
    });

    return units.map(unit => ({
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    }));
  }

  /**
   * Get available units
   */
  static async getAvailableUnits(): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      where: {
        status: 'متاحة',
        deletedAt: null
      },
      orderBy: { code: 'asc' }
    });

    return units.map(unit => ({
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    }));
  }

  /**
   * Get units by status
   */
  static async getUnitsByStatus(status: string): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      where: {
        status,
        deletedAt: null
      },
      orderBy: { code: 'asc' }
    });

    return units.map(unit => ({
      ...unit,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
      deletedAt: unit.deletedAt?.toISOString()
    }));
  }
}