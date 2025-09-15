// Formatting utilities مطابقة لـ format-specs.json بالحرف

import { FORMAT_SPECS } from '@/constants/formats'

// تنسيق العملة
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(FORMAT_SPECS.number_formats.currency.locale, {
    style: 'currency',
    currency: FORMAT_SPECS.number_formats.currency.currency,
    minimumFractionDigits: FORMAT_SPECS.number_formats.currency.minimumFractionDigits,
    maximumFractionDigits: FORMAT_SPECS.number_formats.currency.maximumFractionDigits
  }).format(amount)
}

// تنسيق النسبة المئوية
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: FORMAT_SPECS.number_formats.percentage.minimumFractionDigits,
    maximumFractionDigits: FORMAT_SPECS.number_formats.percentage.maximumFractionDigits
  }).format(value) + '%'
}

// تنسيق الأرقام العشرية
export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: FORMAT_SPECS.number_formats.decimal.minimumFractionDigits,
    maximumFractionDigits: FORMAT_SPECS.number_formats.decimal.maximumFractionDigits
  }).format(value)
}

// تنسيق التاريخ للعرض (ميلادي)
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// تنسيق التاريخ والوقت (ميلادي)
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// تنسيق التاريخ للتخزين
export function formatDateForStorage(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj?.toISOString().split('T')[0] || 'غير محدد'
}

// تنسيق رقم الهاتف
export function formatPhone(phone: string): string {
  if (!phone) return ''
  // إزالة أي أحرف غير رقمية
  const cleaned = phone.replace(/\D/g, '')
  // تنسيق كـ 01XXXXXXXXX
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return cleaned
  }
  return phone
}

// تنسيق الرقم القومي
export function formatNationalId(nationalId: string): string {
  if (!nationalId) return ''
  // إزالة أي أحرف غير رقمية
  const cleaned = nationalId.replace(/\D/g, '')
  // التحقق من الطول
  if (cleaned.length === 14) {
    return cleaned
  }
  return nationalId
}

// تنسيق كود الوحدة
export function formatUnitCode(code: string): string {
  if (!code) return ''
  // تنسيق كـ A-XXX
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  if (cleaned.includes('-')) {
    return cleaned
  }
  return code
}

// تنسيق المبلغ مع العملة
export function formatAmountWithCurrency(amount: number): string {
  return formatCurrency(amount)
}

// تنسيق المبلغ بدون عملة
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// تنسيق النص للعرض
export function formatText(text: string): string {
  if (!text) return ''
  return text.trim()
}

// تنسيق الملاحظات
export function formatNotes(notes: string): string {
  if (!notes) return ''
  return notes.trim()
}

// تنسيق الحالة
export function formatStatus(status: string): string {
  if (!status) return ''
  return status.trim()
}