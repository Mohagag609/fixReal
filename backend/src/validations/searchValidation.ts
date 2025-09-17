import Joi from 'joi';

export const validateSearchQuery = (data: any) => {
  const schema = Joi.object({
    query: Joi.string()
      .optional()
      .messages({
        'string.base': 'استعلام البحث يجب أن يكون نص'
      }),
    entities: Joi.array()
      .items(Joi.string().valid('customers', 'units', 'contracts', 'partners', 'brokers', 'safes'))
      .optional()
      .messages({
        'array.base': 'الكيانات يجب أن تكون مصفوفة',
        'any.only': 'نوع الكيان غير صحيح'
      }),
    groups: Joi.array()
      .items(
        Joi.object({
          operator: Joi.string()
            .valid('AND', 'OR')
            .required()
            .messages({
              'any.only': 'عامل المجموعة يجب أن يكون AND أو OR',
              'any.required': 'عامل المجموعة مطلوب'
            }),
          fields: Joi.array()
            .items(
              Joi.object({
                entity: Joi.string()
                  .valid('customers', 'units', 'contracts', 'partners', 'brokers', 'safes')
                  .required()
                  .messages({
                    'any.only': 'نوع الكيان غير صحيح',
                    'any.required': 'نوع الكيان مطلوب'
                  }),
                field: Joi.string()
                  .required()
                  .messages({
                    'any.required': 'اسم الحقل مطلوب'
                  }),
                operator: Joi.string()
                  .valid('equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 
                         'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between', 
                         'in', 'not_in', 'is_null', 'is_not_null')
                  .required()
                  .messages({
                    'any.only': 'عامل البحث غير صحيح',
                    'any.required': 'عامل البحث مطلوب'
                  }),
                value: Joi.string()
                  .required()
                  .messages({
                    'any.required': 'قيمة البحث مطلوبة'
                  }),
                type: Joi.string()
                  .valid('text', 'number', 'date', 'select', 'boolean')
                  .required()
                  .messages({
                    'any.only': 'نوع الحقل غير صحيح',
                    'any.required': 'نوع الحقل مطلوب'
                  })
              })
            )
            .min(1)
            .required()
            .messages({
              'array.min': 'يجب أن تحتوي المجموعة على حقل واحد على الأقل',
              'any.required': 'حقول المجموعة مطلوبة'
            })
        })
      )
      .optional()
      .messages({
        'array.base': 'المجموعات يجب أن تكون مصفوفة'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateQuickSearch = (data: any) => {
  const schema = Joi.object({
    q: Joi.string()
      .min(1)
      .required()
      .messages({
        'string.min': 'استعلام البحث يجب أن يكون على الأقل حرف واحد',
        'any.required': 'استعلام البحث مطلوب'
      }),
    entity: Joi.string()
      .valid('customers', 'units', 'contracts', 'partners', 'brokers', 'safes')
      .optional()
      .messages({
        'any.only': 'نوع الكيان غير صحيح'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون عدد صحيح',
        'number.min': 'حد النتائج يجب أن يكون على الأقل 1',
        'number.max': 'حد النتائج يجب أن يكون أقل من 100'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateSearchHistory = (data: any) => {
  const schema = Joi.object({
    userId: Joi.string()
      .required()
      .messages({
        'any.required': 'معرف المستخدم مطلوب'
      }),
    query: Joi.string()
      .required()
      .messages({
        'any.required': 'استعلام البحث مطلوب'
      }),
    entity: Joi.string()
      .valid('customers', 'units', 'contracts', 'partners', 'brokers', 'safes')
      .optional()
      .messages({
        'any.only': 'نوع الكيان غير صحيح'
      }),
    results: Joi.array()
      .optional()
      .messages({
        'array.base': 'النتائج يجب أن تكون مصفوفة'
      })
  });

  return schema.validate(data, { abortEarly: false });
};