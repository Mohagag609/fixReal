// دالة مساعدة لفحص التكرار

export const checkDuplicateName = (name: string, existingItems: any[], currentId?: string) => {
  if (!name || !name.trim()) return false
  
  const normalizedName = name.trim().toLowerCase()
  return existingItems.some(item => 
    item.name && 
    item.name.trim().toLowerCase() === normalizedName &&
    item.id !== currentId
  )
}

export const checkDuplicateCode = (code: string, existingItems: any[], currentId?: string) => {
  if (!code || !code.trim()) return false
  
  const normalizedCode = code.trim().toLowerCase()
  return existingItems.some(item => 
    item.code && 
    item.code.trim().toLowerCase() === normalizedCode &&
    item.id !== currentId
  )
}

export const checkDuplicatePhone = (phone: string, existingItems: any[], currentId?: string) => {
  if (!phone || !phone.trim()) return false
  
  const normalizedPhone = phone.trim().replace(/\s+/g, '')
  return existingItems.some(item => 
    item.phone && 
    item.phone.trim().replace(/\s+/g, '') === normalizedPhone &&
    item.id !== currentId
  )
}

export const checkDuplicateNationalId = (nationalId: string, existingItems: any[], currentId?: string) => {
  if (!nationalId || !nationalId.trim()) return false
  
  const normalizedNationalId = nationalId.trim()
  return existingItems.some(item => 
    item.nationalId && 
    item.nationalId.trim() === normalizedNationalId &&
    item.id !== currentId
  )
}