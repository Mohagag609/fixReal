// All calculation utilities for the dashboard

export interface CalculationResult {
  total: number
  count: number
  average?: number
}

// Calculate total amount for invoices
export function calculateInvoiceTotal(
  subtotal: number,
  taxRate: number = 0.14,
  discount: number = 0
): number {
  const taxAmount = subtotal * taxRate
  const discountAmount = subtotal * discount
  return subtotal + taxAmount - discountAmount
}

// Calculate customer balance
export function calculateCustomerBalance(
  totalInvoices: number,
  totalPayments: number
): number {
  return totalInvoices - totalPayments
}

// Calculate monthly revenue
export function calculateMonthlyRevenue(transactions: any[]): CalculationResult {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const count = transactions.length
  const average = count > 0 ? total / count : 0

  return { total, count, average }
}

// Calculate growth percentage
export function calculateGrowthPercentage(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Calculate profit margin
export function calculateProfitMargin(
  revenue: number,
  costs: number
): number {
  if (revenue === 0) return 0
  return ((revenue - costs) / revenue) * 100
}