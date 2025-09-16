export interface DuplicateCheckItem {
  id: string
  name?: string
  phone?: string
  email?: string
  [key: string]: unknown
}

export const checkDuplicateName = (
  name: string, 
  items: DuplicateCheckItem[], 
  excludeId?: string
): boolean => {
  if (!name.trim()) return false
  
  return items.some(item => 
    item.id !== excludeId && 
    item.name?.toLowerCase().trim() === name.toLowerCase().trim()
  )
}

export const checkDuplicatePhone = (
  phone: string, 
  items: DuplicateCheckItem[], 
  excludeId?: string
): boolean => {
  if (!phone.trim()) return false
  
  // Normalize phone number (remove spaces, dashes, etc.)
  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  return items.some(item => {
    if (!item.phone) return false
    const normalizedItemPhone = item.phone.replace(/[\s\-\(\)]/g, '')
    return item.id !== excludeId && normalizedItemPhone === normalizedPhone
  })
}

export const checkDuplicateEmail = (
  email: string, 
  items: DuplicateCheckItem[], 
  excludeId?: string
): boolean => {
  if (!email.trim()) return false
  
  return items.some(item => 
    item.id !== excludeId && 
    item.email?.toLowerCase().trim() === email.toLowerCase().trim()
  )
}

export const checkDuplicateField = (
  field: string,
  value: string,
  items: DuplicateCheckItem[],
  excludeId?: string
): boolean => {
  if (!value.trim()) return false
  
  return items.some(item => 
    item.id !== excludeId && 
    item[field]?.toLowerCase().trim() === value.toLowerCase().trim()
  )
}

export const findDuplicates = (
  items: DuplicateCheckItem[],
  fields: string[] = ['name', 'phone', 'email']
): Array<{
  field: string
  value: string
  duplicates: DuplicateCheckItem[]
}> => {
  const duplicates: Array<{
    field: string
    value: string
    duplicates: DuplicateCheckItem[]
  }> = []

  fields.forEach(field => {
    const fieldValues = new Map<string, DuplicateCheckItem[]>()
    
    items.forEach(item => {
      const value = item[field]
      if (value && typeof value === 'string' && value.trim()) {
        const normalizedValue = value.toLowerCase().trim()
        if (!fieldValues.has(normalizedValue)) {
          fieldValues.set(normalizedValue, [])
        }
        fieldValues.get(normalizedValue)!.push(item)
      }
    })

    fieldValues.forEach((duplicateItems, value) => {
      if (duplicateItems.length > 1) {
        duplicates.push({
          field,
          value,
          duplicates: duplicateItems
        })
      }
    })
  })

  return duplicates
}

export const getDuplicateSuggestions = (
  field: string,
  value: string,
  items: DuplicateCheckItem[],
  excludeId?: string
): DuplicateCheckItem[] => {
  if (!value.trim()) return []
  
  const normalizedValue = value.toLowerCase().trim()
  
  return items
    .filter(item => 
      item.id !== excludeId && 
      item[field]?.toLowerCase().trim().includes(normalizedValue)
    )
    .slice(0, 5) // Limit to 5 suggestions
}

export const validateUniqueFields = (
  data: Record<string, unknown>,
  items: DuplicateCheckItem[],
  fields: string[] = ['name', 'phone', 'email'],
  excludeId?: string
): Array<{
  field: string
  message: string
}> => {
  const errors: Array<{
    field: string
    message: string
  }> = []

  fields.forEach(field => {
    const value = data[field]
    if (!value || typeof value !== 'string' || !value.trim()) return

    const isDuplicate = checkDuplicateField(field, value, items, excludeId)
    if (isDuplicate) {
      errors.push({
        field,
        message: `قيمة ${field} موجودة بالفعل`
      })
    }
  })

  return errors
}