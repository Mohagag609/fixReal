export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv'
  filename?: string
  includeHeaders?: boolean
  dateRange?: {
    from: string
    to: string
  }
  filters?: Record<string, unknown>
}

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
  subtitle?: string
}

export const exportToExcel = (data: ExportData, options: ExportOptions = { format: 'excel' }) => {
  // Create a simple CSV format that can be opened in Excel
  const csvContent = [
    data.title ? `"${data.title}"` : '',
    data.subtitle ? `"${data.subtitle}"` : '',
    '',
    data.headers.map(header => `"${header}"`).join(','),
    ...data.rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    )
  ].filter(line => line !== '').join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${options.filename || 'export'}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToPDF = (data: ExportData, options: ExportOptions = { format: 'pdf' }) => {
  // Create a simple HTML table for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${data.title || 'تقرير'}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          margin: 20px;
        }
        h1 {
          color: #1a2b4c;
          text-align: center;
          margin-bottom: 10px;
        }
        h2 {
          color: #00a896;
          text-align: center;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: right;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #1a2b4c;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      ${data.title ? `<h1>${data.title}</h1>` : ''}
      ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ''}
      <table>
        <thead>
          <tr>
            ${data.headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
      <div class="footer">
        تم إنشاء التقرير في: ${new Date().toLocaleDateString('ar-EG')}
      </div>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${options.filename || 'export'}.html`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToCSV = (data: ExportData, options: ExportOptions = { format: 'csv' }) => {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${options.filename || 'export'}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportData = (data: ExportData, options: ExportOptions) => {
  switch (options.format) {
    case 'excel':
      return exportToExcel(data, options)
    case 'pdf':
      return exportToPDF(data, options)
    case 'csv':
      return exportToCSV(data, options)
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

export const prepareTableDataForExport = <T>(
  data: T[],
  columns: Array<{
    key: string
    label: string
    accessorKey?: string
    cell?: (row: T) => string | number
  }>,
  title?: string,
  subtitle?: string
): ExportData => {
  const headers = columns.map(col => col.label)
  const rows = data.map(item => 
    columns.map(col => {
      if (col.cell) {
        return col.cell(item)
      }
      const key = col.accessorKey || col.key
      return (item as Record<string, unknown>)[key] || ''
    })
  )

  return {
    headers,
    rows,
    title,
    subtitle,
  }
}

export const importFromCSV = (file: File): Promise<Array<Record<string, string>>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          reject(new Error('ملف CSV فارغ أو غير صالح'))
          return
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const row: Record<string, string> = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })

        resolve(rows)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('فشل في قراءة الملف'))
    }

    reader.readAsText(file, 'utf-8')
  })
}

export const validateImportData = <T>(
  data: Array<Record<string, string>>,
  requiredFields: string[],
  validator?: (row: Record<string, string>) => string | null
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (data.length === 0) {
    errors.push('لا توجد بيانات للاستيراد')
    return { valid: false, errors }
  }

  // Check required fields
  const missingFields = requiredFields.filter(field => 
    !data[0] || !data[0][field]
  )

  if (missingFields.length > 0) {
    errors.push(`الحقول المطلوبة مفقودة: ${missingFields.join(', ')}`)
  }

  // Validate each row
  data.forEach((row, index) => {
    if (validator) {
      const error = validator(row)
      if (error) {
        errors.push(`الصف ${index + 1}: ${error}`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}