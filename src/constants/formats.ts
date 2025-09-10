// Format specifications مطابقة لـ format-specs.json بالحرف

export const FORMAT_SPECS = {
  date_formats: {
    display: "DD/MM/YYYY",
    storage: "YYYY-MM-DD",
    timezone: "Africa/Cairo"
  },
  number_formats: {
    currency: {
      locale: "ar-EG",
      currency: "EGP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      display: "{value} ج.م"
    },
    percentage: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      display: "{value}%"
    },
    decimal: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  text_formats: {
    phone: "01XXXXXXXXX",
    national_id: "14 digits",
    unit_code: "A-XXX format"
  },
  export_formats: {
    csv: {
      encoding: "UTF-8",
      delimiter: ",",
      quote: "\"",
      escape: "\"\""
    },
    excel: {
      sheet_name: "البيانات",
      header_style: "bold",
      auto_width: true
    },
    json: {
      indent: 2,
      encoding: "UTF-8"
    }
  }
} as const

// Helper functions for formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(FORMAT_SPECS.number_formats.currency.locale, {
    style: 'currency',
    currency: FORMAT_SPECS.number_formats.currency.currency,
    minimumFractionDigits: FORMAT_SPECS.number_formats.currency.minimumFractionDigits,
    maximumFractionDigits: FORMAT_SPECS.number_formats.currency.maximumFractionDigits
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: FORMAT_SPECS.number_formats.percentage.minimumFractionDigits,
    maximumFractionDigits: FORMAT_SPECS.number_formats.percentage.maximumFractionDigits
  }).format(value) + '%'
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: FORMAT_SPECS.number_formats.decimal.minimumFractionDigits,
    maximumFractionDigits: FORMAT_SPECS.number_formats.decimal.maximumFractionDigits
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

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