import Joi from 'joi';

export const validateNotification = (data: any) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('critical', 'important', 'info')
      .required()
      .messages({
        'any.only': 'نوع الإشعار يجب أن يكون حرج أو مهم أو معلومات',
        'any.required': 'نوع الإشعار مطلوب'
      }),
    title: Joi.string()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.min': 'عنوان الإشعار يجب أن يكون على الأقل حرف واحد',
        'string.max': 'عنوان الإشعار يجب أن يكون أقل من 200 حرف',
        'any.required': 'عنوان الإشعار مطلوب'
      }),
    message: Joi.string()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.min': 'رسالة الإشعار يجب أن تكون على الأقل حرف واحد',
        'string.max': 'رسالة الإشعار يجب أن تكون أقل من 1000 حرف',
        'any.required': 'رسالة الإشعار مطلوبة'
      }),
    category: Joi.string()
      .valid('system', 'financial', 'contracts', 'payments', 'maintenance', 'security')
      .required()
      .messages({
        'any.only': 'فئة الإشعار غير صحيحة',
        'any.required': 'فئة الإشعار مطلوبة'
      }),
    acknowledged: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'حالة القراءة يجب أن تكون صحيحة أو خاطئة'
      }),
    acknowledgedBy: Joi.string()
      .optional()
      .messages({
        'string.base': 'معرف المستخدم يجب أن يكون نص'
      }),
    expiresAt: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.greater': 'تاريخ انتهاء الصلاحية يجب أن يكون في المستقبل'
      }),
    data: Joi.object()
      .optional()
      .messages({
        'object.base': 'البيانات الإضافية يجب أن تكون كائن'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateNotificationUpdate = (data: any) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('critical', 'important', 'info')
      .optional(),
    title: Joi.string()
      .min(1)
      .max(200)
      .optional(),
    message: Joi.string()
      .min(1)
      .max(1000)
      .optional(),
    category: Joi.string()
      .valid('system', 'financial', 'contracts', 'payments', 'maintenance', 'security')
      .optional(),
    acknowledged: Joi.boolean()
      .optional(),
    acknowledgedBy: Joi.string()
      .optional(),
    expiresAt: Joi.date()
      .greater('now')
      .optional(),
    data: Joi.object()
      .optional()
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateNotificationFilters = (data: any) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم',
        'number.integer': 'رقم الصفحة يجب أن يكون عدد صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون على الأقل 1'
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
      }),
    type: Joi.string()
      .valid('critical', 'important', 'info')
      .optional(),
    category: Joi.string()
      .valid('system', 'financial', 'contracts', 'payments', 'maintenance', 'security')
      .optional(),
    acknowledged: Joi.boolean()
      .optional()
  });

  return schema.validate(data, { abortEarly: false });
};