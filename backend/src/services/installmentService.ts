import prisma from '../config/database';
import { Installment, InstallmentCreateRequest, InstallmentUpdateRequest, SearchQuery } from '../types';

export class InstallmentService {
  /**
   * Get all installments with pagination and search
   */
  static async getAllInstallments(query: SearchQuery): Promise<{
    installments: Installment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, status, sortBy = 'dueDate', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { unit: { name: { contains: search, mode: 'insensitive' } } },
        { unit: { code: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get installments and total count
    const [installments, total] = await Promise.all([
      prisma.installment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          unit: {
            include: {
              contracts: {
                include: {
                  customer: true
                }
              }
            }
          }
        }
      }),
      prisma.installment.count({ where })
    ]);

    return {
      installments: installments.map(installment => ({
        ...installment,
        dueDate: installment.dueDate.toISOString(),
        createdAt: installment.createdAt.toISOString(),
        updatedAt: installment.updatedAt.toISOString(),
        deletedAt: installment.deletedAt?.toISOString()
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
   * Get installment by ID
   */
  static async getInstallmentById(id: string): Promise<Installment | null> {
    const installment = await prisma.installment.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    });

    if (!installment) return null;

    return {
      ...installment,
      dueDate: installment.dueDate.toISOString(),
      createdAt: installment.createdAt.toISOString(),
      updatedAt: installment.updatedAt.toISOString(),
      deletedAt: installment.deletedAt?.toISOString()
    };
  }

  /**
   * Create new installment
   */
  static async createInstallment(data: InstallmentCreateRequest): Promise<Installment> {
    // Validate unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId, deletedAt: null }
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    const installment = await prisma.installment.create({
      data: {
        unitId: data.unitId,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        status: data.status || 'معلق',
        notes: data.notes
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    });

    return {
      ...installment,
      dueDate: installment.dueDate.toISOString(),
      createdAt: installment.createdAt.toISOString(),
      updatedAt: installment.updatedAt.toISOString(),
      deletedAt: installment.deletedAt?.toISOString()
    };
  }

  /**
   * Update installment
   */
  static async updateInstallment(id: string, data: InstallmentUpdateRequest): Promise<Installment | null> {
    // Check if installment exists
    const existingInstallment = await prisma.installment.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingInstallment) return null;

    const installment = await prisma.installment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    });

    return {
      ...installment,
      dueDate: installment.dueDate.toISOString(),
      createdAt: installment.createdAt.toISOString(),
      updatedAt: installment.updatedAt.toISOString(),
      deletedAt: installment.deletedAt?.toISOString()
    };
  }

  /**
   * Delete installment (soft delete)
   */
  static async deleteInstallment(id: string): Promise<boolean> {
    const installment = await prisma.installment.findUnique({
      where: { id, deletedAt: null }
    });

    if (!installment) return false;

    await prisma.installment.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return true;
  }

  /**
   * Mark installment as paid
   */
  static async markAsPaid(id: string, paymentDate?: string, notes?: string): Promise<Installment | null> {
    const installment = await prisma.installment.findUnique({
      where: { id, deletedAt: null }
    });

    if (!installment) return null;

    const updatedInstallment = await prisma.installment.update({
      where: { id },
      data: {
        status: 'مدفوع',
        ...(paymentDate && { paidDate: new Date(paymentDate) }),
        ...(notes && { notes: notes })
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    });

    return {
      ...updatedInstallment,
      dueDate: updatedInstallment.dueDate.toISOString(),
      createdAt: updatedInstallment.createdAt.toISOString(),
      updatedAt: updatedInstallment.updatedAt.toISOString(),
      deletedAt: updatedInstallment.deletedAt?.toISOString()
    };
  }

  /**
   * Get overdue installments
   */
  static async getOverdueInstallments(): Promise<Installment[]> {
    const installments = await prisma.installment.findMany({
      where: {
        status: 'معلق',
        dueDate: { lt: new Date() },
        deletedAt: null
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
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
   * Get installments by status
   */
  static async getInstallmentsByStatus(status: string): Promise<Installment[]> {
    const installments = await prisma.installment.findMany({
      where: {
        status,
        deletedAt: null
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
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
   * Get installments by unit
   */
  static async getInstallmentsByUnit(unitId: string): Promise<Installment[]> {
    const installments = await prisma.installment.findMany({
      where: {
        unitId,
        deletedAt: null
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
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
   * Search installments
   */
  static async searchInstallments(searchTerm: string): Promise<Installment[]> {
    const installments = await prisma.installment.findMany({
      where: {
        deletedAt: null,
        OR: [
          { unit: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { unit: { code: { contains: searchTerm, mode: 'insensitive' } } },
          { notes: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
      },
      take: 10,
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
   * Get installments by date range
   */
  static async getInstallmentsByDateRange(startDate: string, endDate: string): Promise<Installment[]> {
    const installments = await prisma.installment.findMany({
      where: {
        deletedAt: null,
        dueDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        unit: {
          include: {
            contracts: {
              include: {
                customer: true
              }
            }
          }
        }
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
   * Get installment statistics
   */
  static async getInstallmentStats(): Promise<{
    totalInstallments: number;
    paidInstallments: number;
    pendingInstallments: number;
    overdueInstallments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  }> {
    const [installments, overdueCount, overdueAmount] = await Promise.all([
      prisma.installment.findMany({
        where: { deletedAt: null }
      }),
      prisma.installment.count({
        where: {
          status: 'معلق',
          dueDate: { lt: new Date() },
          deletedAt: null
        }
      }),
      prisma.installment.aggregate({
        where: {
          status: 'معلق',
          dueDate: { lt: new Date() },
          deletedAt: null
        },
        _sum: { amount: true }
      })
    ]);

    const totalInstallments = installments.length;
    const paidInstallments = installments.filter(i => i.status === 'مدفوع').length;
    const pendingInstallments = installments.filter(i => i.status === 'معلق').length;
    const overdueInstallments = overdueCount;

    const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0);
    const paidAmount = installments
      .filter(i => i.status === 'مدفوع')
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = installments
      .filter(i => i.status === 'معلق')
      .reduce((sum, i) => sum + i.amount, 0);
    const overdueAmount = overdueAmount._sum.amount || 0;

    return {
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      overdueInstallments,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount
    };
  }
}