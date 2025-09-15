# PowerShell script to refresh dashboard materialized view
# Run this script every 5 minutes to keep dashboard data fresh
# 
# Usage:
# .\scripts\refresh-dashboard-cron.ps1
# 
# Or add to Windows Task Scheduler:
# - Action: Start a program
# - Program: powershell.exe
# - Arguments: -File "G:\goo\New folder (2) - Copy\scripts\refresh-dashboard-cron.ps1"

$API_BASE_URL = $env:API_BASE_URL
if (-not $API_BASE_URL) {
    $API_BASE_URL = "http://localhost:3000"
}

$ADMIN_TOKEN = $env:ADMIN_TOKEN
if (-not $ADMIN_TOKEN) {
    $ADMIN_TOKEN = "your-admin-token-here"
}

function Refresh-Dashboard {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        Write-Host "[$timestamp] Starting dashboard refresh..." -ForegroundColor Green

        $url = "$API_BASE_URL/api/admin/refresh-dashboard"
        $headers = @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $ADMIN_TOKEN"
        }

        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -ErrorAction Stop
        
        if ($response.success) {
            $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            Write-Host "[$timestamp] ✅ Dashboard refreshed successfully: $($response.message)" -ForegroundColor Green
        } else {
            $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
            Write-Host "[$timestamp] ❌ Dashboard refresh failed: $($response.error)" -ForegroundColor Red
        }

    } catch {
        $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        Write-Host "[$timestamp] ❌ Error refreshing dashboard: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Run the refresh
Refresh-Dashboard

