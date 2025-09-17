import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SearchFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null' | 'date_range' | 'text_search'
  value: any
  value2?: any
  logicalOperator?: 'AND' | 'OR'
}

export interface SearchSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface SearchOptions {
  filters: SearchFilter[]
  sorts: SearchSort[]
  page: number
  limit: number
  searchText?: string
  searchFields?: string[]
}

export interface SearchResult<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export class AdvancedSearchService {
  // البحث في العملاء
  static async searchCustomers(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            contracts: true,
            transactions: true
          }
        }),
        prisma.customer.count({ where })
      ])

      return this.buildSearchResult(customers, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching customers:', error)
      throw new Error('فشل في البحث في العملاء')
    }
  }

  // البحث في الوحدات
  static async searchUnits(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [units, total] = await Promise.all([
        prisma.unit.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            contracts: true,
            partnerGroups: true
          }
        }),
        prisma.unit.count({ where })
      ])

      return this.buildSearchResult(units, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching units:', error)
      throw new Error('فشل في البحث في الوحدات')
    }
  }

  // البحث في العقود
  static async searchContracts(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            customer: true,
            unit: true,
            installments: true
          }
        }),
        prisma.contract.count({ where })
      ])

      return this.buildSearchResult(contracts, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching contracts:', error)
      throw new Error('فشل في البحث في العقود')
    }
  }

  // البحث في المعاملات
  static async searchTransactions(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            customer: true,
            unit: true,
            contract: true
          }
        }),
        prisma.transaction.count({ where })
      ])

      return this.buildSearchResult(transactions, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching transactions:', error)
      throw new Error('فشل في البحث في المعاملات')
    }
  }

  // البحث في الفواتير
  static async searchInvoices(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            customer: true,
            contract: true
          }
        }),
        prisma.invoice.count({ where })
      ])

      return this.buildSearchResult(invoices, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching invoices:', error)
      throw new Error('فشل في البحث في الفواتير')
    }
  }

  // البحث في الشركاء
  static async searchPartners(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [partners, total] = await Promise.all([
        prisma.partner.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            partnerGroups: true,
            debts: true
          }
        }),
        prisma.partner.count({ where })
      ])

      return this.buildSearchResult(partners, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching partners:', error)
      throw new Error('فشل في البحث في الشركاء')
    }
  }

  // البحث في السماسرة
  static async searchBrokers(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [brokers, total] = await Promise.all([
        prisma.broker.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            dues: true
          }
        }),
        prisma.broker.count({ where })
      ])

      return this.buildSearchResult(brokers, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching brokers:', error)
      throw new Error('فشل في البحث في السماسرة')
    }
  }

  // البحث في الخزائن
  static async searchSafes(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [safes, total] = await Promise.all([
        prisma.safe.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            transfers: true
          }
        }),
        prisma.safe.count({ where })
      ])

      return this.buildSearchResult(safes, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching safes:', error)
      throw new Error('فشل في البحث في الخزائن')
    }
  }

  // البحث في السندات
  static async searchVouchers(options: SearchOptions): Promise<SearchResult> {
    try {
      const where = this.buildWhereClause(options.filters, options.searchText, options.searchFields)
      const orderBy = this.buildOrderByClause(options.sorts)

      const [vouchers, total] = await Promise.all([
        prisma.voucher.findMany({
          where,
          orderBy,
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          include: {
            customer: true,
            contract: true
          }
        }),
        prisma.voucher.count({ where })
      ])

      return this.buildSearchResult(vouchers, total, options.page, options.limit)
    } catch (error) {
      console.error('Error searching vouchers:', error)
      throw new Error('فشل في البحث في السندات')
    }
  }

  // البحث الشامل في جميع الجداول
  static async globalSearch(searchText: string, options: Partial<SearchOptions> = {}): Promise<{
    customers: SearchResult
    units: SearchResult
    contracts: SearchResult
    transactions: SearchResult
    invoices: SearchResult
    partners: SearchResult
    brokers: SearchResult
    safes: SearchResult
    vouchers: SearchResult
  }> {
    try {
      const searchOptions: SearchOptions = {
        filters: options.filters || [],
        sorts: options.sorts || [],
        page: options.page || 1,
        limit: options.limit || 10,
        searchText,
        searchFields: options.searchFields
      }

      const [
        customers,
        units,
        contracts,
        transactions,
        invoices,
        partners,
        brokers,
        safes,
        vouchers
      ] = await Promise.all([
        this.searchCustomers(searchOptions),
        this.searchUnits(searchOptions),
        this.searchContracts(searchOptions),
        this.searchTransactions(searchOptions),
        this.searchInvoices(searchOptions),
        this.searchPartners(searchOptions),
        this.searchBrokers(searchOptions),
        this.searchSafes(searchOptions),
        this.searchVouchers(searchOptions)
      ])

      return {
        customers,
        units,
        contracts,
        transactions,
        invoices,
        partners,
        brokers,
        safes,
        vouchers
      }
    } catch (error) {
      console.error('Error in global search:', error)
      throw new Error('فشل في البحث الشامل')
    }
  }

  // بناء شرط WHERE
  private static buildWhereClause(filters: SearchFilter[], searchText?: string, searchFields?: string[]) {
    const where: any = {}

    // إضافة الفلاتر
    if (filters.length > 0) {
      const conditions = filters.map(filter => this.buildFilterCondition(filter))
      where.AND = conditions
    }

    // إضافة البحث النصي
    if (searchText && searchFields && searchFields.length > 0) {
      const textSearchConditions = searchFields.map(field => ({
        [field]: {
          contains: searchText,
          mode: 'insensitive'
        }
      }))

      if (where.AND) {
        where.AND.push({ OR: textSearchConditions })
      } else {
        where.OR = textSearchConditions
      }
    }

    return where
  }

  // بناء شرط الفلتر
  private static buildFilterCondition(filter: SearchFilter) {
    const { field, operator, value, value2 } = filter

    switch (operator) {
      case 'equals':
        return { [field]: value }
      case 'not_equals':
        return { [field]: { not: value } }
      case 'contains':
        return { [field]: { contains: value, mode: 'insensitive' } }
      case 'not_contains':
        return { [field]: { not: { contains: value, mode: 'insensitive' } } }
      case 'starts_with':
        return { [field]: { startsWith: value, mode: 'insensitive' } }
      case 'ends_with':
        return { [field]: { endsWith: value, mode: 'insensitive' } }
      case 'greater_than':
        return { [field]: { gt: value } }
      case 'less_than':
        return { [field]: { lt: value } }
      case 'between':
        return { [field]: { gte: value, lte: value2 } }
      case 'in':
        return { [field]: { in: Array.isArray(value) ? value : [value] } }
      case 'not_in':
        return { [field]: { notIn: Array.isArray(value) ? value : [value] } }
      case 'is_null':
        return { [field]: null }
      case 'is_not_null':
        return { [field]: { not: null } }
      case 'date_range':
        return { [field]: { gte: value, lte: value2 } }
      case 'text_search':
        return { [field]: { contains: value, mode: 'insensitive' } }
      default:
        return {}
    }
  }

  // بناء شرط ORDER BY
  private static buildOrderByClause(sorts: SearchSort[]) {
    if (sorts.length === 0) {
      return { createdAt: 'desc' }
    }

    return sorts.map(sort => ({
      [sort.field]: sort.direction
    }))
  }

  // بناء نتيجة البحث
  private static buildSearchResult<T>(data: T[], total: number, page: number, limit: number): SearchResult<T> {
    const pages = Math.ceil(total / limit)
    const hasNext = page < pages
    const hasPrev = page > 1

    return {
      data,
      total,
      page,
      limit,
      pages,
      hasNext,
      hasPrev
    }
  }

  // الحصول على الحقول المتاحة للبحث
  static getSearchableFields(table: string): string[] {
    const fieldsMap: Record<string, string[]> = {
      customers: ['name', 'email', 'phone', 'address', 'notes'],
      units: ['name', 'description', 'location', 'notes'],
      contracts: ['contractNumber', 'notes', 'status'],
      transactions: ['description', 'notes', 'type'],
      invoices: ['invoiceNumber', 'description', 'notes'],
      partners: ['name', 'email', 'phone', 'address', 'notes'],
      brokers: ['name', 'email', 'phone', 'address', 'notes'],
      safes: ['name', 'description', 'location'],
      vouchers: ['voucherNumber', 'description', 'notes']
    }

    return fieldsMap[table] || []
  }

  // الحصول على أنواع الفلاتر المتاحة
  static getFilterTypes(): Record<string, string[]> {
    return {
      string: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_null', 'is_not_null', 'text_search'],
      number: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'in', 'not_in', 'is_null', 'is_not_null'],
      date: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'date_range', 'is_null', 'is_not_null'],
      boolean: ['equals', 'not_equals', 'is_null', 'is_not_null']
    }
  }

  // الحصول على إحصائيات البحث
  static async getSearchStats(searchText: string): Promise<{
    totalResults: number
    resultsByTable: Record<string, number>
    searchTime: number
  }> {
    try {
      const startTime = Date.now()

      const searchOptions: SearchOptions = {
        filters: [],
        sorts: [],
        page: 1,
        limit: 1,
        searchText
      }

      const [
        customers,
        units,
        contracts,
        transactions,
        invoices,
        partners,
        brokers,
        safes,
        vouchers
      ] = await Promise.all([
        this.searchCustomers(searchOptions),
        this.searchUnits(searchOptions),
        this.searchContracts(searchOptions),
        this.searchTransactions(searchOptions),
        this.searchInvoices(searchOptions),
        this.searchPartners(searchOptions),
        this.searchBrokers(searchOptions),
        this.searchSafes(searchOptions),
        this.searchVouchers(searchOptions)
      ])

      const resultsByTable = {
        customers: customers.total,
        units: units.total,
        contracts: contracts.total,
        transactions: transactions.total,
        invoices: invoices.total,
        partners: partners.total,
        brokers: brokers.total,
        safes: safes.total,
        vouchers: vouchers.total
      }

      const totalResults = Object.values(resultsByTable).reduce((sum, count) => sum + count, 0)
      const searchTime = Date.now() - startTime

      return {
        totalResults,
        resultsByTable,
        searchTime
      }
    } catch (error) {
      console.error('Error getting search stats:', error)
      throw new Error('فشل في الحصول على إحصائيات البحث')
    }
  }

  // حفظ البحث
  static async saveSearch(userId: string, searchName: string, searchOptions: SearchOptions): Promise<boolean> {
    try {
      // يمكن إضافة جدول لحفظ عمليات البحث المفضلة
      // await prisma.savedSearch.create({
      //   data: {
      //     userId,
      //     name: searchName,
      //     options: JSON.stringify(searchOptions),
      //     createdAt: new Date()
      //   }
      // })

      return true
    } catch (error) {
      console.error('Error saving search:', error)
      throw new Error('فشل في حفظ البحث')
    }
  }

  // الحصول على عمليات البحث المحفوظة
  static async getSavedSearches(userId: string): Promise<any[]> {
    try {
      // يمكن إضافة جدول لحفظ عمليات البحث المفضلة
      // const searches = await prisma.savedSearch.findMany({
      //   where: { userId },
      //   orderBy: { createdAt: 'desc' }
      // })

      return []
    } catch (error) {
      console.error('Error getting saved searches:', error)
      throw new Error('فشل في الحصول على عمليات البحث المحفوظة')
    }
  }
}