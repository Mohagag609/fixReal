import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Auth validation rules
 */
export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user')
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

export const validateUpdateProfile = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
];

export const validateUpdateUser = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Common validation rules
 */
export const validateId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isLength({ min: 1 })
    .withMessage('Invalid ID format')
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Sort field is required when provided'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

export const validateSearch = [
  ...validatePagination,
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('status')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Status must be between 1 and 50 characters'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date')
];

/**
 * Customer validation rules
 */
export const validateCustomer = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  
  body('nationalId')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('National ID must be between 10 and 20 characters'),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['نشط', 'غير نشط'])
    .withMessage('Status must be either نشط or غير نشط'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

/**
 * Unit validation rules
 */
export const validateUnit = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Code must be between 1 and 50 characters'),
  
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  
  body('unitType')
    .optional()
    .isIn(['سكني', 'تجاري', 'إداري'])
    .withMessage('Unit type must be سكني, تجاري, or إداري'),
  
  body('area')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Area must not exceed 50 characters'),
  
  body('floor')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Floor must not exceed 20 characters'),
  
  body('building')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Building must not exceed 100 characters'),
  
  body('totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),
  
  body('status')
    .optional()
    .isIn(['متاحة', 'محجوزة', 'مباعة'])
    .withMessage('Status must be متاحة, محجوزة, or مباعة'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

/**
 * Contract validation rules
 */
export const validateContract = [
  body('unitId')
    .notEmpty()
    .withMessage('Unit ID is required'),
  
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required'),
  
  body('start')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  body('totalPrice')
    .notEmpty()
    .withMessage('Total price is required')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),
  
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  
  body('brokerName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Broker name must not exceed 100 characters'),
  
  body('brokerPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Broker percentage must be between 0 and 100'),
  
  body('brokerAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Broker amount must be a positive number'),
  
  body('maintenanceDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maintenance deposit must be a positive number'),
  
  body('installmentType')
    .optional()
    .isIn(['شهري', 'ربع سنوي', 'نصف سنوي', 'سنوي'])
    .withMessage('Installment type must be شهري, ربع سنوي, نصف سنوي, or سنوي'),
  
  body('installmentCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Installment count must be a non-negative integer'),
  
  body('extraAnnual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Extra annual must be a non-negative integer'),
  
  body('annualPaymentValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual payment value must be a positive number'),
  
  body('downPayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),
  
  body('paymentType')
    .optional()
    .isIn(['installment', 'cash', 'mixed'])
    .withMessage('Payment type must be installment, cash, or mixed')
];