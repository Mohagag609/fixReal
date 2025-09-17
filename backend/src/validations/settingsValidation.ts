import Joi from 'joi';

export const validateSettings = (data: any) => {
  const schema = Joi.object({
    key: Joi.string()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .messages({
        'string.pattern.base': 'المفتاح يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط',
        'string.min': 'المفتاح يجب أن يكون على الأقل حرف واحد',
        'string.max': 'المفتاح يجب أن يكون أقل من 100 حرف',
        'any.required': 'المفتاح مطلوب'
      }),
    value: Joi.string()
      .max(1000)
      .required()
      .messages({
        'string.max': 'القيمة يجب أن تكون أقل من 1000 حرف',
        'any.required': 'القيمة مطلوبة'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateBulkSettings = (data: any) => {
  const schema = Joi.object({
    settings: Joi.object()
      .pattern(
        Joi.string().pattern(/^[a-zA-Z0-9_-]+$/),
        Joi.string().max(1000)
      )
      .required()
      .messages({
        'object.pattern': 'الإعدادات يجب أن تكون مفتاح-قيمة صحيحة',
        'any.required': 'الإعدادات مطلوبة'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateImportSettings = (data: any) => {
  const schema = Joi.object({
    settings: Joi.array()
      .items(
        Joi.object({
          key: Joi.string()
            .min(1)
            .max(100)
            .pattern(/^[a-zA-Z0-9_-]+$/)
            .required(),
          value: Joi.string()
            .max(1000)
            .required()
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'يجب أن تحتوي على إعداد واحد على الأقل',
        'any.required': 'الإعدادات مطلوبة'
      })
  });

  return schema.validate(data, { abortEarly: false });
};