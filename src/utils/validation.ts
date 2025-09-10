// Validation utilities مطابقة لـ business-rules.json بالحرف

import { BUSINESS_RULES } from '@/constants/business-rules'
import { ERROR_MESSAGES } from '@/constants/errors'

// التحقق من صحة رقم الهاتف
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: false, error: ERROR_MESSAGES.validation.required }
  }
  
  const regex = new RegExp(BUSINESS_RULES.validation_rules.phone_format)
  if (!regex.test(phone)) {
    return { isValid: false, error: ERROR_MESSAGES.validation.invalid_phone }
  }
  
  return { isValid: true }
}

// التحقق من صحة الرقم القومي
export function validateNationalId(nationalId: string): { isValid: boolean; error?: string } {
  if (!nationalId) {
    return { isValid: true } // الرقم القومي اختياري
  }
  
  const regex = new RegExp(BUSINESS_RULES.validation_rules.national_id_format)
  if (!regex.test(nationalId)) {
    return { isValid: false, error: ERROR_MESSAGES.validation.invalid_national_id }
  }
  
  return { isValid: true }
}

// التحقق من صحة المبلغ
export function validateAmount(amount: number): { isValid: boolean; error?: string } {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: ERROR_MESSAGES.validation.required }
  }
  
  if (amount < BUSINESS_RULES.validation_rules.amount_min) {
    return { isValid: false, error: ERROR_MESSAGES.validation.invalid_amount }
  }
  
  return { isValid: true }
}

// التحقق من صحة النسبة المئوية
export function validatePercentage(percentage: number): { isValid: boolean; error?: string } {
  if (percentage === undefined || percentage === null) {
    return { isValid: false, error: ERROR_MESSAGES.validation.required }
  }
  
  if (percentage < BUSINESS_RULES.validation_rules.percentage_min || 
      percentage > BUSINESS_RULES.validation_rules.percentage_max) {
    return { isValid: false, error: ERROR_MESSAGES.validation.invalid_percentage }
  }
  
  return { isValid: true }
}

// التحقق من صحة التاريخ
export function validateDate(date: string): { isValid: boolean; error?: string } {
  if (!date) {
    return { isValid: false, error: ERROR_MESSAGES.validation.required }
  }
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: ERROR_MESSAGES.validation.invalid_date }
  }
  
  return { isValid: true }
}

// التحقق من صحة كود الوحدة
export function validateUnitCode(code: string): { isValid: boolean; error?: string } {
  if (!code) {
    return { isValid: false, error: ERROR_MESSAGES.validation.required }
  }
  
  const regex = new RegExp(BUSINESS_RULES.validation_rules.unit_code_format)
  if (!regex.test(code)) {
    return { isValid: false, error: ERROR_MESSAGES.validation.invalid_amount }
  }
  
  return { isValid: true }
}

// التحقق من صحة تاريخ الاستحقاق
export function validateDueDate(dueDate: string): { isValid: boolean; error?: string } {
  const dateValidation = validateDate(dueDate)
  if (!dateValidation.isValid) {
    return dateValidation
  }
  
  const dateObj = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (dateObj < today) {
    return { isValid: false, error: ERROR_MESSAGES.business.invalid_due_date }
  }
  
  return { isValid: true }
}

// التحقق من صحة العميل
export function validateCustomer(customer: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!customer.name) {
    errors.push(ERROR_MESSAGES.validation.required)
  }
  
  // رقم الهاتف اختياري، لكن إذا تم إدخاله يجب أن يكون صحيحاً
  if (customer.phone && customer.phone.trim()) {
    const phoneValidation = validatePhone(customer.phone)
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error!)
    }
  }
  
  if (customer.nationalId) {
    const nationalIdValidation = validateNationalId(customer.nationalId)
    if (!nationalIdValidation.isValid) {
      errors.push(nationalIdValidation.error!)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// التحقق من صحة الوحدة
export function validateUnit(unit: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // الاسم فقط مطلوب
  if (!unit.name) {
    errors.push(ERROR_MESSAGES.validation.required)
  }
  
  // الكود اختياري (سيتم إنشاؤه تلقائياً)
  if (unit.code) {
    const codeValidation = validateUnitCode(unit.code)
    if (!codeValidation.isValid) {
      errors.push(codeValidation.error!)
    }
  }
  
  // السعر اختياري
  if (unit.totalPrice !== undefined && unit.totalPrice !== null && unit.totalPrice !== '') {
    const amountValidation = validateAmount(parseFloat(unit.totalPrice))
    if (!amountValidation.isValid) {
      errors.push(amountValidation.error!)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// التحقق من صحة العقد
export function validateContract(contract: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!contract.unitId) {
    errors.push(ERROR_MESSAGES.validation.required)
  }
  
  if (!contract.customerId) {
    errors.push(ERROR_MESSAGES.validation.required)
  }
  
  const dateValidation = validateDate(contract.start)
  if (!dateValidation.isValid) {
    errors.push(dateValidation.error!)
  }
  
  const amountValidation = validateAmount(contract.totalPrice)
  if (!amountValidation.isValid) {
    errors.push(amountValidation.error!)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}