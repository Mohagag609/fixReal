'use client'

import { useState, useEffect } from 'react'

export default function TestSafes() {
  const [safes, setSafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSafes = async () => {
      try {
        const token = localStorage.getItem('authToken')
        console.log('Token from localStorage:', token)
        
        if (!token) {
          setError('No token found in localStorage')
          setLoading(false)
          return
        }

        const response = await fetch('/api/safes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Response status:', response.status)
        
        const data = await response.json()
        console.log('Response data:', data)
        
        if (data.success) {
          setSafes(data.data)
        } else {
          setError(data.error)
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchSafes()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Safes</h1>
      <p>Number of safes: {safes.length}</p>
      <pre>{JSON.stringify(safes, null, 2)}</pre>
    </div>
  )
}