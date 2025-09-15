// Storage keys مطابقة لـ storage-keys.json بالحرف

export const STORAGE_KEYS = {
  localStorage_keys: {
    legacy_app_key: "estate_pro_final_v3",
    migration_complete: "migrationComplete",
    user_preferences: "userPreferences",
    theme: "theme",
    font_size: "fontSize",
    language: "language"
  },
  indexedDB_stores: [
    "customers",
    "units", 
    "partners",
    "unitPartners",
    "contracts",
    "installments",
    "partnerDebts",
    "safes",
    "transfers",
    "auditLog",
    "vouchers",
    "brokerDues",
    "brokers",
    "partnerGroups",
    "settings",
    "keyval"
  ],
  sessionStorage_keys: {
    auth_token: "authToken",
    user_session: "userSession",
    temp_data: "tempData"
  },
  cookie_keys: {
    session_id: "sessionId",
    user_preferences: "userPrefs"
  }
} as const

// Helper functions for storage operations
export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.sessionStorage_keys.auth_token)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.sessionStorage_keys.auth_token, token)
}

export function removeAuthToken(): void {
  localStorage.removeItem(STORAGE_KEYS.sessionStorage_keys.auth_token)
}

export function getUserPreferences(): Record<string, unknown> | null {
  const prefs = localStorage.getItem(STORAGE_KEYS.localStorage_keys.user_preferences)
  return prefs ? JSON.parse(prefs) : null
}

export function setUserPreferences(preferences: Record<string, unknown>): void {
  localStorage.setItem(STORAGE_KEYS.localStorage_keys.user_preferences, JSON.stringify(preferences))
}

export function getTheme(): string {
  return localStorage.getItem(STORAGE_KEYS.localStorage_keys.theme) || 'light'
}

export function setTheme(theme: string): void {
  localStorage.setItem(STORAGE_KEYS.localStorage_keys.theme, theme)
}

export function getFontSize(): string {
  return localStorage.getItem(STORAGE_KEYS.localStorage_keys.font_size) || 'medium'
}

export function setFontSize(size: string): void {
  localStorage.setItem(STORAGE_KEYS.localStorage_keys.font_size, size)
}

export function getLanguage(): string {
  return localStorage.getItem(STORAGE_KEYS.localStorage_keys.language) || 'ar'
}

export function setLanguage(language: string): void {
  localStorage.setItem(STORAGE_KEYS.localStorage_keys.language, language)
}

export function isMigrationComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.localStorage_keys.migration_complete) === 'true'
}

export function setMigrationComplete(): void {
  localStorage.setItem(STORAGE_KEYS.localStorage_keys.migration_complete, 'true')
}