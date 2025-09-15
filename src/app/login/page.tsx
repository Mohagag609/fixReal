'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dbConfigured, setDbConfigured] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkDatabaseStatus()
    
    // توجيه تلقائي لصفحة الإعدادات إذا لم تكن قاعدة البيانات مُعدة
    const timer = setTimeout(() => {
      if (dbConfigured === false) {
        router.push('/setup')
      }
    }, 2000) // انتظار ثانيتين
    
    return () => clearTimeout(timer)
  }, [dbConfigured, router])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      setDbConfigured(data.configured)
      
      console.log('Database status checked:', data.configured)
    } catch (err) {
      console.error('Error checking database status:', err)
      setDbConfigured(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('authToken', data.data.token)
        router.push('/')
      } else {
        // التحقق من وجود redirectTo في الاستجابة
        if (data.redirectTo === '/setup') {
          // توجيه تلقائي لصفحة الإعدادات
          setTimeout(() => {
            router.push('/setup')
          }, 2000) // انتظار ثانيتين لإظهار الرسالة
          setError(data.message || 'سيتم توجيهك لصفحة الإعدادات...')
        } else {
          setError(data.error || 'خطأ في تسجيل الدخول')
        }
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">مدير الاستثمار العقاري</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
          />
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        
        <div style={{ 
          marginTop: '16px', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={() => router.push('/forgot-password')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            🔐 نسيت كلمة المرور؟
          </button>


          {dbConfigured === false && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#dc2626',
                fontWeight: '500'
              }}>
                ❌ قاعدة البيانات غير مُعدة
              </p>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: '400'
              }}>
                سيتم توجيهك تلقائياً لصفحة الإعدادات خلال ثانية واحدة...
              </p>
              <button
                onClick={() => router.push('/setup')}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                ⚙️ إعداد قاعدة البيانات الآن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}