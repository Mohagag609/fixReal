'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotifications } from '../../components/NotificationSystem'

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addNotification } = useNotifications()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyToken(token)
    } else {
      setVerifying(false)
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'رابط إعادة التعيين غير صحيح'
      })
    }
  }, [searchParams])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setTokenValid(true)
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ',
          message: 'رابط إعادة التعيين غير صحيح أو منتهي الصلاحية'
        })
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'حدث خطأ أثناء التحقق من الرابط'
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (newPassword !== confirmPassword) {
      addNotification({
        type: 'error',
        title: 'خطأ في كلمة المرور',
        message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين'
      })
      setLoading(false)
      return
    }

    try {
      const token = searchParams.get('token')
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم تغيير كلمة المرور',
          message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول'
        })
        router.push('/login')
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ',
          message: data.error || 'فشل في تغيير كلمة المرور'
        })
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'حدث خطأ أثناء تغيير كلمة المرور'
      })
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <p className="text-gray-600">جاري التحقق من رابط إعادة التعيين...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">رابط غير صحيح</h1>
          <p className="text-gray-600 mb-6">رابط إعادة التعيين غير صحيح أو منتهي الصلاحية</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">إعادة تعيين كلمة المرور</h1>
        <p className="text-gray-600 text-center mb-6">
          أدخل كلمة المرور الجديدة
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            العودة لتسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}