import { z } from 'zod';

export const brokerValidation = {
  createBroker: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
      phone: z.string().optional(),
      nationalId: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(['نشط', 'غير نشط']).optional(),
      notes: z.string().optional()
    })
  }),

  updateBroker: z.object({
    params: z.object({
      id: z.string().uuid('Invalid broker ID')
    }),
    body: z.object({
      name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
      phone: z.string().optional(),
      nationalId: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(['نشط', 'غير نشط']).optional(),
      notes: z.string().optional()
    })
  }),

  getBroker: z.object({
    params: z.object({
      id: z.string().uuid('Invalid broker ID')
    })
  }),

  deleteBroker: z.object({
    params: z.object({
      id: z.string().uuid('Invalid broker ID')
    })
  }),

  getBrokerContracts: z.object({
    params: z.object({
      id: z.string().uuid('Invalid broker ID')
    })
  }),

  getBrokerStats: z.object({
    params: z.object({
      id: z.string().uuid('Invalid broker ID')
    })
  }),

  searchBrokers: z.object({
    params: z.object({
      term: z.string().min(1, 'Search term is required')
    })
  }),

  getBrokersByStatus: z.object({
    params: z.object({
      status: z.enum(['نشط', 'غير نشط'])
    })
  })
};