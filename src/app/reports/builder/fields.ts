/**
 * تعريفات الحقول والفلاتر - Fields & Filters
 * يحتوي على تعريفات جميع الحقول والفلاتر المستخدمة في نظام التقارير
 */

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  multiple?: boolean
}

export interface ReportDefinition {
  id: string
  name: string
  description: string
  icon: string
  color: string
  filters: FilterField[]
  defaultFilters?: Record<string, unknown>
}

/**
 * تعريفات التقارير المتاحة
 */
export const reportDefinitions: ReportDefinition[] = [
  {
    id: 'installments',
    name: 'تقرير الأقساط',
    description: 'تقرير شامل لحالة الأقساط والتحصيلات',
    icon: '📅',
    color: 'from-green-500 to-green-600',
    filters: [
      {
        key: 'projectId',
        label: 'الوحدة',
        type: 'select',
        placeholder: 'اختر الوحدة',
        options: [] // سيتم تحميلها ديناميكياً
      },
      {
        key: 'from',
        label: 'من تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'to',
        label: 'إلى تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'status',
        label: 'الحالة',
        type: 'select',
        options: [
          { value: 'معلق', label: 'معلق' },
          { value: 'مسدد', label: 'مسدد' },
          { value: 'متأخر', label: 'متأخر' },
          { value: 'ملغي', label: 'ملغي' }
        ]
      },
      {
        key: 'q',
        label: 'بحث نصي',
        type: 'text',
        placeholder: 'ابحث في كود الوحدة أو الاسم أو الملاحظات'
      }
    ],
    defaultFilters: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] || 'غير محدد',
      to: new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'
    }
  },
  
  {
    id: 'payments',
    name: 'تقرير التحصيلات',
    description: 'تقرير سندات القبض والتحصيلات',
    icon: '💰',
    color: 'from-blue-500 to-blue-600',
    filters: [
      {
        key: 'projectId',
        label: 'الوحدة',
        type: 'select',
        placeholder: 'اختر الوحدة',
        options: [] // سيتم تحميلها ديناميكياً
      },
      {
        key: 'from',
        label: 'من تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'to',
        label: 'إلى تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'method',
        label: 'طريقة الدفع',
        type: 'select',
        options: [
          { value: 'نقد', label: 'نقد' },
          { value: 'تحويل', label: 'تحويل بنكي' },
          { value: 'شيك', label: 'شيك' },
          { value: 'بطاقة', label: 'بطاقة ائتمان' }
        ]
      },
      {
        key: 'q',
        label: 'بحث نصي',
        type: 'text',
        placeholder: 'ابحث في الوصف أو اسم الدافع'
      }
    ],
    defaultFilters: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] || 'غير محدد',
      to: new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'
    }
  },
  
  {
    id: 'aging',
    name: 'تحليل المتأخرات',
    description: 'تحليل الأقساط المتأخرة حسب فئات التأخير',
    icon: '⏰',
    color: 'from-red-500 to-red-600',
    filters: [
      {
        key: 'projectId',
        label: 'الوحدة',
        type: 'select',
        placeholder: 'اختر الوحدة',
        options: [] // سيتم تحميلها ديناميكياً
      },
      {
        key: 'from',
        label: 'من تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'to',
        label: 'إلى تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'agingCategory',
        label: 'فئة التأخير',
        type: 'multiselect',
        options: [
          { value: '0-30', label: '0-30 يوم' },
          { value: '31-60', label: '31-60 يوم' },
          { value: '61-90', label: '61-90 يوم' },
          { value: '>90', label: 'أكثر من 90 يوم' }
        ]
      },
      {
        key: 'q',
        label: 'بحث نصي',
        type: 'text',
        placeholder: 'ابحث في كود الوحدة أو اسم العميل'
      }
    ],
    defaultFilters: {
      from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0] || 'غير محدد',
      to: new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'
    }
  },
  
  {
    id: 'customers',
    name: 'تقرير العملاء',
    description: 'عرض بيانات العملاء والعقود المرتبطة',
    icon: '👥',
    color: 'from-purple-500 to-purple-600',
    filters: [
      {
        key: 'status',
        label: 'الحالة',
        type: 'select',
        options: [
          { value: 'نشط', label: 'نشط' },
          { value: 'غير نشط', label: 'غير نشط' }
        ]
      },
      {
        key: 'from',
        label: 'من تاريخ',
        type: 'date',
        required: false
      },
      {
        key: 'to',
        label: 'إلى تاريخ',
        type: 'date',
        required: false
      },
      {
        key: 'q',
        label: 'بحث نصي',
        type: 'text',
        placeholder: 'ابحث في اسم العميل أو رقم الهاتف'
      }
    ]
  },
  
  {
    id: 'units',
    name: 'تقرير الوحدات',
    description: 'عرض الوحدات المتاحة والمباعة',
    icon: '🏠',
    color: 'from-indigo-500 to-indigo-600',
    filters: [
      {
        key: 'status',
        label: 'الحالة',
        type: 'select',
        options: [
          { value: 'متاحة', label: 'متاحة' },
          { value: 'مباعة', label: 'مباعة' },
          { value: 'محجوزة', label: 'محجوزة' }
        ]
      },
      {
        key: 'unitType',
        label: 'نوع الوحدة',
        type: 'select',
        options: [
          { value: 'سكني', label: 'سكني' },
          { value: 'تجاري', label: 'تجاري' },
          { value: 'إداري', label: 'إداري' }
        ]
      },
      {
        key: 'building',
        label: 'المبنى',
        type: 'text',
        placeholder: 'اسم المبنى'
      },
      {
        key: 'q',
        label: 'بحث نصي',
        type: 'text',
        placeholder: 'ابحث في كود الوحدة أو الوصف'
      }
    ]
  },
  
  {
    id: 'financial',
    name: 'التقرير المالي',
    description: 'ملخص شامل للوضع المالي',
    icon: '📈',
    color: 'from-emerald-500 to-emerald-600',
    filters: [
      {
        key: 'from',
        label: 'من تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'to',
        label: 'إلى تاريخ',
        type: 'date',
        required: true
      },
      {
        key: 'safeId',
        label: 'الخزينة',
        type: 'select',
        placeholder: 'اختر الخزينة',
        options: [] // سيتم تحميلها ديناميكياً
      }
    ],
    defaultFilters: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] || 'غير محدد',
      to: new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'
    }
  }
]

/**
 * فئات التأخير
 */
export const agingCategories = [
  { value: '0-30', label: '0-30 يوم', color: 'green' },
  { value: '31-60', label: '31-60 يوم', color: 'yellow' },
  { value: '61-90', label: '61-90 يوم', color: 'orange' },
  { value: '>90', label: 'أكثر من 90 يوم', color: 'red' }
]

/**
 * حالات الأقساط
 */
export const installmentStatuses = [
  { value: 'معلق', label: 'معلق', color: 'yellow' },
  { value: 'مسدد', label: 'مسدد', color: 'green' },
  { value: 'متأخر', label: 'متأخر', color: 'red' },
  { value: 'ملغي', label: 'ملغي', color: 'gray' }
]

/**
 * طرق الدفع
 */
export const paymentMethods = [
  { value: 'نقد', label: 'نقد' },
  { value: 'تحويل', label: 'تحويل بنكي' },
  { value: 'شيك', label: 'شيك' },
  { value: 'بطاقة', label: 'بطاقة ائتمان' },
  { value: 'أخرى', label: 'أخرى' }
]

/**
 * خيارات التصدير
 */
export const exportOptions = [
  { value: 'excel', label: 'Excel', icon: '📊', description: 'ملف Excel قابل للتعديل' },
  { value: 'csv', label: 'CSV', icon: '📄', description: 'ملف CSV للاستيراد' },
  { value: 'pdf', label: 'PDF', icon: '📋', description: 'ملف PDF للطباعة' },
  { value: 'print', label: 'طباعة', icon: '🖨️', description: 'طباعة مباشرة' }
]

/**
 * إعدادات الجدول
 */
export const tableSettings = {
  pageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  showPagination: true,
  showSearch: true,
  showFilters: true,
  showExport: true,
  showPrint: true
}

/**
 * ألوان الحالات
 */
export const statusColors: Record<string, string> = {
  'معلق': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'مسدد': 'bg-green-100 text-green-800 border-green-200',
  'متأخر': 'bg-red-100 text-red-800 border-red-200',
  'ملغي': 'bg-gray-100 text-gray-800 border-gray-200',
  '0-30': 'bg-green-100 text-green-800 border-green-200',
  '31-60': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '61-90': 'bg-orange-100 text-orange-800 border-orange-200',
  '>90': 'bg-red-100 text-red-800 border-red-200'
}

/**
 * رسائل النظام
 */
export const messages = {
  loading: 'جاري التحميل...',
  noData: 'لا توجد بيانات للعرض',
  error: 'حدث خطأ في تحميل البيانات',
  exportSuccess: 'تم التصدير بنجاح',
  exportError: 'فشل في التصدير',
  printSuccess: 'تم إرسال التقرير للطباعة',
  printError: 'فشل في الطباعة',
  filterApplied: 'تم تطبيق الفلاتر',
  filterCleared: 'تم مسح الفلاتر',
  dataRefreshed: 'تم تحديث البيانات'
}

/**
 * تحقق من صحة الفلاتر
 */
export function validateFilters(filters: Record<string, unknown>, reportId: string): string[] {
  const errors: string[] = []
  const report = reportDefinitions.find(r => r.id === reportId)
  
  if (!report) {
    errors.push('نوع التقرير غير صحيح')
    return errors
  }
  
  report.filters.forEach(field => {
    if (field.required && (!filters[field.key] || filters[field.key] === '')) {
      errors.push(`${field.label} مطلوب`)
    }
    
      if (field.type === 'date' && filters[field.key]) {
        // runtime-guard unknown -> string
        const raw = filters[field.key]
        const val = typeof raw === 'string' ? raw : (raw instanceof Date ? raw.toISOString() : String(raw))
        const date = new Date(val)
        if (isNaN(date.getTime())) {
          errors.push(`${field.label} غير صحيح`)
        }
      }
    
      if (field.type === 'number' && filters[field.key]) {
        // guard unknown -> number
        const raw = filters[field.key]
        const num = typeof raw === 'number' ? raw : Number(raw)
        if (isNaN(num) || num < 0) {
          errors.push(`${field.label} يجب أن يكون رقماً صحيحاً`)
        }
      }
  })
  
  // التحقق من صحة نطاق التاريخ
    if (filters.from && filters.to) {
      const rawFrom = filters.from
      const rawTo = filters.to
      const fromVal = typeof rawFrom === 'string' ? rawFrom : (rawFrom instanceof Date ? rawFrom.toISOString() : String(rawFrom))
      const toVal = typeof rawTo === 'string' ? rawTo : (rawTo instanceof Date ? rawTo.toISOString() : String(rawTo))
      const fromDate = new Date(fromVal)
      const toDate = new Date(toVal)

      if (fromDate > toDate) {
        errors.push('تاريخ البداية يجب أن يكون قبل تاريخ النهاية')
      }
    }
  
  return errors
}

/**
 * تطبيق الفلاتر الافتراضية
 */
export function applyDefaultFilters(reportId: string): Record<string, unknown> {
  const report = reportDefinitions.find(r => r.id === reportId)
  return report?.defaultFilters || {}
}