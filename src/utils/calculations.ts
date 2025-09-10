// Calculation utilities مطابقة لـ business-rules.json بالحرف

import { BUSINESS_RULES } from '@/constants/business-rules'

// حساب حالة القسط
export function calculateInstallmentStatus(amount: number, paidAmount: number): string {
  if (paidAmount === 0) {
    return 'معلق'
  } else if (paidAmount < amount) {
    return 'جزئي'
  } else {
    return 'مدفوع'
  }
}

// حساب المبلغ المتبقي
export function calculateRemaining(totalPrice: number, discountAmount: number, paidAmount: number): number {
  const remaining = totalPrice - discountAmount - paidAmount
  return Math.round(remaining * 100) / 100 // تقريب لـ 2 منازل عشرية
}

// حساب نسبة التحصيل
export function calculateCollectionPercentage(totalReceipts: number, totalSales: number): number {
  if (totalSales === 0) return 0
  const percentage = (totalReceipts / totalSales) * 100
  return Math.round(percentage * 100) / 100 // تقريب لـ 2 منازل عشرية
}

// حساب صافي الربح
export function calculateNetProfit(totalReceipts: number, totalExpenses: number): number {
  return totalReceipts - totalExpenses
}

// حساب إجمالي المبيعات
export function calculateTotalSales(contracts: any[]): number {
  return contracts.reduce((total, contract) => {
    return total + (contract.totalPrice - contract.discountAmount)
  }, 0)
}

// حساب إجمالي المقبوضات
export function calculateTotalReceipts(vouchers: any[]): number {
  return vouchers
    .filter(voucher => voucher.type === 'receipt')
    .reduce((total, voucher) => total + voucher.amount, 0)
}

// حساب إجمالي المصروفات
export function calculateTotalExpenses(vouchers: any[]): number {
  return vouchers
    .filter(voucher => voucher.type === 'payment')
    .reduce((total, voucher) => total + voucher.amount, 0)
}

// حساب إجمالي الديون
export function calculateTotalDebt(installments: any[]): number {
  return installments
    .filter(installment => installment.status !== 'مدفوع')
    .reduce((total, installment) => total + installment.amount, 0)
}

// حساب عدد الوحدات
export function calculateUnitCounts(units: any[]): {
  total: number
  available: number
  sold: number
  reserved: number
} {
  return {
    total: units.length,
    available: units.filter(unit => unit.status === 'متاحة').length,
    sold: units.filter(unit => unit.status === 'مباعة').length,
    reserved: units.filter(unit => unit.status === 'محجوزة').length
  }
}

// حساب عدد المستثمرين
export function calculateInvestorCount(customers: any[]): number {
  return customers.filter(customer => customer.status === 'نشط').length
}

// حساب Dashboard KPIs
export function calculateDashboardKPIs(
  contracts: any[],
  vouchers: any[],
  installments: any[],
  units: any[],
  customers: any[]
): {
  totalSales: number
  totalReceipts: number
  totalExpenses: number
  netProfit: number
  collectionPercentage: number
  totalDebt: number
  unitCounts: {
    total: number
    available: number
    sold: number
    reserved: number
  }
  investorCount: number
} {
  const totalSales = calculateTotalSales(contracts)
  const totalReceipts = calculateTotalReceipts(vouchers)
  const totalExpenses = calculateTotalExpenses(vouchers)
  const netProfit = calculateNetProfit(totalReceipts, totalExpenses)
  const collectionPercentage = calculateCollectionPercentage(totalReceipts, totalSales)
  const totalDebt = calculateTotalDebt(installments)
  const unitCounts = calculateUnitCounts(units)
  const investorCount = calculateInvestorCount(customers)

  return {
    totalSales,
    totalReceipts,
    totalExpenses,
    netProfit,
    collectionPercentage,
    totalDebt,
    unitCounts,
    investorCount
  }
}