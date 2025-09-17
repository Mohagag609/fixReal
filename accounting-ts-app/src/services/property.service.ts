import prisma from '../config/db';
import { CreatePropertyData, UpdatePropertyData, PropertySummary } from '../models/property.model';

export class PropertyService {
  async createProperty(data: CreatePropertyData) {
    return prisma.property.create({
      data: {
        title: data.title,
        description: data.description || null,
        address: data.address,
        type: data.type,
        status: data.status || 'available',
        price: data.price,
        rentPrice: data.rentPrice || null,
        area: data.area || null,
        rooms: data.rooms || null,
        bathrooms: data.bathrooms || null,
        accountId: data.accountId,
      },
    });
  }

  async getAllProperties() {
    return prisma.property.findMany({
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contracts: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            rentAmount: true,
            salePrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPropertyById(id: number) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contracts: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            category: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    return property;
  }

  async updateProperty(id: number, data: UpdatePropertyData) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new Error('Property not found');
    }

    return prisma.property.update({
      where: { id },
      data,
    });
  }

  async deleteProperty(id: number) {
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new Error('Property not found');
    }

    return prisma.property.delete({ where: { id } });
  }

  async getPropertiesByStatus(status: string) {
    return prisma.property.findMany({
      where: { status },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contracts: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            rentAmount: true,
            salePrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPropertiesByType(type: string) {
    return prisma.property.findMany({
      where: { type },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contracts: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            rentAmount: true,
            salePrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPropertySummary(): Promise<PropertySummary> {
    const properties = await prisma.property.findMany({
      include: {
        contracts: {
          where: { status: 'active' },
        },
      },
    });

    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.status === 'available').length;
    const rentedProperties = properties.filter(p => p.status === 'rented').length;
    const soldProperties = properties.filter(p => p.status === 'sold').length;
    const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
    const totalRentIncome = properties
      .filter(p => p.status === 'rented')
      .reduce((sum, p) => sum + (p.rentPrice || 0), 0);

    return {
      totalProperties,
      availableProperties,
      rentedProperties,
      soldProperties,
      totalValue,
      totalRentIncome,
    };
  }

  async searchProperties(query: string) {
    return prisma.property.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contracts: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            rentAmount: true,
            salePrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}