#!/usr/bin/env node

/**
 * Cron job script to refresh dashboard materialized view
 * Run this script every 5 minutes to keep dashboard data fresh
 * 
 * Usage:
 * node scripts/refresh-dashboard-cron.js
 * 
 * Or add to crontab:
 * */5 * * * * cd /path/to/project && node scripts/refresh-dashboard-cron.js
 */

import https from 'https'
import http from 'http'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here'

async function refreshDashboard() {
  try {
    console.log(`[${new Date().toISOString()}] Starting dashboard refresh...`)

    const url = `${API_BASE_URL}/api/admin/refresh-dashboard`
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    }

    const response = await makeRequest(url, options)
    
    if (response.success) {
      console.log(`[${new Date().toISOString()}] ✅ Dashboard refreshed successfully: ${response.message}`)
    } else {
      console.error(`[${new Date().toISOString()}] ❌ Dashboard refresh failed: ${response.error}`)
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error refreshing dashboard:`, error.message)
  }
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    
    const req = client.request(url, options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve(jsonData)
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.end()
  })
}

// Run the refresh
refreshDashboard()

