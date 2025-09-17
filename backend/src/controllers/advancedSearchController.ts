import { Request, Response } from 'express'
import { AdvancedSearchService } from '../services/advancedSearchService'
import { auditMiddleware } from '../middleware/auditMiddleware'

export class AdvancedSearchController {
  // البحث في العملاء
  static async searchCustomers(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchCustomers(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_CUSTOMERS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching customers:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في العملاء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في الوحدات
  static async searchUnits(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchUnits(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_UNITS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching units:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في الوحدات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في العقود
  static async searchContracts(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchContracts(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_CONTRACTS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching contracts:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في العقود',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في المعاملات
  static async searchTransactions(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchTransactions(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_TRANSACTIONS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching transactions:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في المعاملات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في الفواتير
  static async searchInvoices(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchInvoices(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_INVOICES', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching invoices:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في الفواتير',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في الشركاء
  static async searchPartners(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchPartners(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_PARTNERS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching partners:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في الشركاء',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في السماسرة
  static async searchBrokers(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchBrokers(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_BROKERS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching brokers:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في السماسرة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في الخزائن
  static async searchSafes(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchSafes(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_SAFES', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching safes:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في الخزائن',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث في السندات
  static async searchVouchers(req: Request, res: Response) {
    try {
      const searchOptions = req.body

      const result = await AdvancedSearchService.searchVouchers(searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SEARCH_VOUCHERS', {
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error searching vouchers:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث في السندات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث الشامل
  static async globalSearch(req: Request, res: Response) {
    try {
      const { searchText, ...options } = req.body

      if (!searchText) {
        return res.status(400).json({
          success: false,
          message: 'نص البحث مطلوب'
        })
      }

      const result = await AdvancedSearchService.globalSearch(searchText, options)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'GLOBAL_SEARCH', {
        searchText,
        filtersCount: options.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error in global search:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث الشامل',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على الحقول المتاحة للبحث
  static async getSearchableFields(req: Request, res: Response) {
    try {
      const { table } = req.params

      const fields = AdvancedSearchService.getSearchableFields(table)

      res.json({
        success: true,
        data: fields
      })
    } catch (error) {
      console.error('Error getting searchable fields:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على الحقول المتاحة للبحث',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على أنواع الفلاتر المتاحة
  static async getFilterTypes(req: Request, res: Response) {
    try {
      const filterTypes = AdvancedSearchService.getFilterTypes()

      res.json({
        success: true,
        data: filterTypes
      })
    } catch (error) {
      console.error('Error getting filter types:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على أنواع الفلاتر',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على إحصائيات البحث
  static async getSearchStats(req: Request, res: Response) {
    try {
      const { searchText } = req.query

      if (!searchText) {
        return res.status(400).json({
          success: false,
          message: 'نص البحث مطلوب'
        })
      }

      const stats = await AdvancedSearchService.getSearchStats(searchText as string)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting search stats:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على إحصائيات البحث',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // حفظ البحث
  static async saveSearch(req: Request, res: Response) {
    try {
      const { searchName, searchOptions } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول'
        })
      }

      if (!searchName || !searchOptions) {
        return res.status(400).json({
          success: false,
          message: 'اسم البحث وخيارات البحث مطلوبة'
        })
      }

      await AdvancedSearchService.saveSearch(userId, searchName, searchOptions)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'SAVE_SEARCH', {
        searchName,
        searchText: searchOptions.searchText
      })

      res.json({
        success: true,
        message: 'تم حفظ البحث بنجاح'
      })
    } catch (error) {
      console.error('Error saving search:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في حفظ البحث',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على عمليات البحث المحفوظة
  static async getSavedSearches(req: Request, res: Response) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول'
        })
      }

      const searches = await AdvancedSearchService.getSavedSearches(userId)

      res.json({
        success: true,
        data: searches
      })
    } catch (error) {
      console.error('Error getting saved searches:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على عمليات البحث المحفوظة',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث السريع
  static async quickSearch(req: Request, res: Response) {
    try {
      const { q, limit = 5 } = req.query

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'نص البحث مطلوب'
        })
      }

      const searchOptions = {
        filters: [],
        sorts: [],
        page: 1,
        limit: parseInt(limit as string),
        searchText: q as string
      }

      const [customers, units, contracts, transactions] = await Promise.all([
        AdvancedSearchService.searchCustomers(searchOptions),
        AdvancedSearchService.searchUnits(searchOptions),
        AdvancedSearchService.searchContracts(searchOptions),
        AdvancedSearchService.searchTransactions(searchOptions)
      ])

      const result = {
        customers: customers.data,
        units: units.data,
        contracts: contracts.data,
        transactions: transactions.data,
        totalResults: customers.total + units.total + contracts.total + transactions.total
      }

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error in quick search:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث السريع',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // البحث المتقدم مع واجهة برمجية
  static async advancedSearch(req: Request, res: Response) {
    try {
      const { table, searchOptions } = req.body

      if (!table || !searchOptions) {
        return res.status(400).json({
          success: false,
          message: 'الجدول وخيارات البحث مطلوبة'
        })
      }

      let result
      switch (table) {
        case 'customers':
          result = await AdvancedSearchService.searchCustomers(searchOptions)
          break
        case 'units':
          result = await AdvancedSearchService.searchUnits(searchOptions)
          break
        case 'contracts':
          result = await AdvancedSearchService.searchContracts(searchOptions)
          break
        case 'transactions':
          result = await AdvancedSearchService.searchTransactions(searchOptions)
          break
        case 'invoices':
          result = await AdvancedSearchService.searchInvoices(searchOptions)
          break
        case 'partners':
          result = await AdvancedSearchService.searchPartners(searchOptions)
          break
        case 'brokers':
          result = await AdvancedSearchService.searchBrokers(searchOptions)
          break
        case 'safes':
          result = await AdvancedSearchService.searchSafes(searchOptions)
          break
        case 'vouchers':
          result = await AdvancedSearchService.searchVouchers(searchOptions)
          break
        default:
          return res.status(400).json({
            success: false,
            message: 'الجدول غير مدعوم'
          })
      }

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'ADVANCED_SEARCH', {
        table,
        searchText: searchOptions.searchText,
        filtersCount: searchOptions.filters?.length || 0
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error in advanced search:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في البحث المتقدم',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }
}