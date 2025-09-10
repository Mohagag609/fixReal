'use client';

import { createContext, useContext, ReactNode } from 'react';

// إنشاء Context بسيط
const AppContext = createContext({});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppContext.Provider value={{}}>
      {children}
    </AppContext.Provider>
  );
}

// Hook لاستخدام Context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a Provider');
  }
  return context;
}