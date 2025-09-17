import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Layout } from '../components/layout/Layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'نظام المحاسبة - Accounting System',
  description: 'نظام محاسبي متطور لإدارة العقارات والعقود',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  )
}