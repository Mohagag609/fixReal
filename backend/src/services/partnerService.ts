import prisma from '../config/database';
import { Partner, PartnerCreateRequest, PartnerUpdateRequest, SearchQuery } from '../types';

export class PartnerService {
  /**
   * Get all partners with pagination and search
   */
  static async getAllPartners(query: SearchQuery): Promise<{
    partners: Partner[];
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
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get partners and total count
    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.partner.count({ where })
    ]);

    return {
      partners: partners.map(partner => ({
        ...partner,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString(),
        deletedAt: partner.deletedAt?.toISOString()
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
   * Get partner by ID
   */
  static async getPartnerById(id: string): Promise<Partner | null> {
    const partner = await prisma.partner.findUnique({
      where: { id, deletedAt: null },
      include: {
        unitPartners: {
          where: { deletedAt: null },
          include: {
            unit: true
          }
        }
      }
    });

    if (!partner) return null;

    return {
      ...partner,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
      deletedAt: partner.deletedAt?.toISOString()
    };
  }

  /**
   * Create new partner
   */
  static async createPartner(data: PartnerCreateRequest): Promise<Partner> {
    // Check for duplicate phone or national ID
    if (data.phone || data.nationalId) {
      const existingPartner = await prisma.partner.findFirst({
        where: {
          deletedAt: null,
          OR: [
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.nationalId ? [{ nationalId: data.nationalId }] : [])
          ]
        }
      });

      if (existingPartner) {
        throw new Error('Partner with this phone or national ID already exists');
      }
    }

    const partner = await prisma.partner.create({
      data: {
        name: data.name,
        phone: data.phone,
        nationalId: data.nationalId,
        address: data.address,
        status: data.status || 'نشط',
        notes: data.notes
      }
    });

    return {
      ...partner,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
      deletedAt: partner.deletedAt?.toISOString()
    };
  }

  /**
   * Update partner
   */
  static async updatePartner(id: string, data: PartnerUpdateRequest): Promise<Partner | null> {
    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingPartner) return null;

    // Check for duplicate phone or national ID (excluding current partner)
    if (data.phone || data.nationalId) {
      const duplicatePartner = await prisma.partner.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          OR: [
            ...(data.phone ? [{ phone: data.phone }] : []),
            ...(data.nationalId ? [{ nationalId: data.nationalId }] : [])
          ]
        }
      });

      if (duplicatePartner) {
        throw new Error('Partner with this phone or national ID already exists');
      }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    return {
      ...partner,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
      deletedAt: partner.deletedAt?.toISOString()
    };
  }

  /**
   * Delete partner (soft delete)
   */
  static async deletePartner(id: string): Promise<boolean> {
    const partner = await prisma.partner.findUnique({
      where: { id, deletedAt: null }
    });

    if (!partner) return false;

    await prisma.partner.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Get partner units
   */
  static async getPartnerUnits(partnerId: string): Promise<any[]> {
    const unitPartners = await prisma.unitPartner.findMany({
      where: {
        partnerId,
        deletedAt: null
      },
      include: {
        unit: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return unitPartners.map(unitPartner => ({
      ...unitPartner,
      createdAt: unitPartner.createdAt.toISOString(),
      updatedAt: unitPartner.updatedAt.toISOString(),
      deletedAt: unitPartner.deletedAt?.toISOString()
    }));
  }

  /**
   * Get partner statistics
   */
  static async getPartnerStats(partnerId: string): Promise<{
    totalUnits: number;
    totalValue: number;
    lastUnitDate?: string;
  }> {
    const unitPartners = await prisma.unitPartner.findMany({
      where: { partnerId, deletedAt: null },
      include: { unit: true }
    });

    const totalUnits = unitPartners.length;
    const totalValue = unitPartners.reduce((sum, up) => sum + (up.unit?.totalPrice || 0), 0);
    const lastUnitDate = unitPartners.length > 0 
      ? unitPartners.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString()
      : undefined;

    return {
      totalUnits,
      totalValue,
      lastUnitDate
    };
  }

  /**
   * Search partners
   */
  static async searchPartners(searchTerm: string): Promise<Partner[]> {
    const partners = await prisma.partner.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { nationalId: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    return partners.map(partner => ({
      ...partner,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
      deletedAt: partner.deletedAt?.toISOString()
    }));
  }

  /**
   * Get partners by status
   */
  static async getPartnersByStatus(status: string): Promise<Partner[]> {
    const partners = await prisma.partner.findMany({
      where: {
        status,
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });

    return partners.map(partner => ({
      ...partner,
      createdAt: partner.createdAt.toISOString(),
      updatedAt: partner.updatedAt.toISOString(),
      deletedAt: partner.deletedAt?.toISOString()
    }));
  }
}