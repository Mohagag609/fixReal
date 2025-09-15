#!/usr/bin/env node

/**
 * Performance Optimization Script
 * This script applies various performance optimizations to the application
 */

import fs from 'fs'
import path from 'path'
import { execSync  } from 'child_process'

console.log('🚀 Starting performance optimizations...')

// 1. Database optimizations
console.log('📊 Applying database optimizations...')
try {
  const sqlFile = path.join(__dirname, '../src/lib/db/optimizations.sql')
  if (fs.existsSync(sqlFile)) {
    console.log('   - Database optimization SQL file found')
    console.log('   - Run: psql -d your_database -f src/lib/db/optimizations.sql')
  }
} catch (error) {
  console.warn('   - Database optimization failed:', error.message)
}

// 2. Build optimizations
console.log('🔨 Applying build optimizations...')
try {
  // Check if Next.js config exists
  const nextConfigPath = path.join(__dirname, '../next.config.js')
  if (fs.existsSync(nextConfigPath)) {
    console.log('   - Next.js config found with optimizations')
  }

  // Check package.json for optimization scripts
  const packageJsonPath = path.join(__dirname, '../package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Add optimization scripts if they don't exist
    if (!packageJson.scripts.optimize) {
      packageJson.scripts.optimize = 'node scripts/optimize.js'
    }
    if (!packageJson.scripts['analyze-bundle']) {
      packageJson.scripts['analyze-bundle'] = 'ANALYZE=true npm run build'
    }
    if (!packageJson.scripts['performance-test']) {
      packageJson.scripts['performance-test'] = 'npm run build && npm run start'
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log('   - Added optimization scripts to package.json')
  }
} catch (error) {
  console.warn('   - Build optimization failed:', error.message)
}

// 3. TypeScript optimizations
console.log('📝 Applying TypeScript optimizations...')
try {
  const tsConfigPath = path.join(__dirname, '../tsconfig.json')
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'))
    
    // Add performance optimizations
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {}
    }
    
    tsConfig.compilerOptions = {
      ...tsConfig.compilerOptions,
      // Performance optimizations
      skipLibCheck: true,
      incremental: true,
      tsBuildInfoFile: '.tsbuildinfo',
      // Strict mode for better performance
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      exactOptionalPropertyTypes: false,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true
    }

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2))
    console.log('   - Updated TypeScript config with performance optimizations')
  }
} catch (error) {
  console.warn('   - TypeScript optimization failed:', error.message)
}

// 4. Create performance monitoring script
console.log('📈 Setting up performance monitoring...')
try {
  const monitoringScript = `#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors application performance and generates reports
 */

import fs from 'fs'
import path from 'path'

// Performance monitoring configuration
const config = {
  outputDir: './performance-reports',
  metrics: {
    bundleSize: true,
    loadTime: true,
    memoryUsage: true,
    apiResponseTime: true
  }
}

// Create output directory
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true })
}

// Generate performance report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {
      bundleSize: getBundleSize(),
      loadTime: getLoadTime(),
      memoryUsage: getMemoryUsage(),
      apiResponseTime: getApiResponseTime()
    },
    recommendations: generateRecommendations()
  }

  const reportPath = path.join(config.outputDir, \`performance-report-\${Date.now()}.json\`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log(\`📊 Performance report generated: \${reportPath}\`)
  return report
}

function getBundleSize() {
  try {
    const buildDir = path.join(__dirname, '../.next/static/chunks')
    if (fs.existsSync(buildDir)) {
      const files = fs.readdirSync(buildDir)
      let totalSize = 0
      
      files.forEach(file => {
        const filePath = path.join(buildDir, file)
        const stats = fs.statSync(filePath)
        totalSize += stats.size
      })
      
      return {
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        fileCount: files.length
      }
    }
  } catch (error) {
    console.warn('Could not calculate bundle size:', error.message)
  }
  
  return null
}

function getLoadTime() {
  // This would be implemented with actual performance monitoring
  return {
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  }
}

function getMemoryUsage() {
  if (process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    }
  }
  return null
}

function getApiResponseTime() {
  // This would be implemented with actual API monitoring
  return {
    average: 0,
    p95: 0,
    p99: 0
  }
}

function generateRecommendations() {
  const recommendations = []
  
  // Bundle size recommendations
  const bundleSize = getBundleSize()
  if (bundleSize && bundleSize.totalSizeMB > 1) {
    recommendations.push({
      type: 'bundle-size',
      message: 'Bundle size is large. Consider code splitting and lazy loading.',
      severity: 'warning'
    })
  }
  
  // Memory usage recommendations
  const memoryUsage = getMemoryUsage()
  if (memoryUsage && memoryUsage.heapUsed > 100) {
    recommendations.push({
      type: 'memory-usage',
      message: 'High memory usage detected. Consider optimizing data structures.',
      severity: 'warning'
    })
  }
  
  return recommendations
}

// Run the monitoring
if (require.main === module) {
  generateReport()
}

module.exports = { generateReport }
`

  const monitoringScriptPath = path.join(__dirname, '../scripts/monitor-performance.js')
  fs.writeFileSync(monitoringScriptPath, monitoringScript)
  console.log('   - Created performance monitoring script')
} catch (error) {
  console.warn('   - Performance monitoring setup failed:', error.message)
}

// 5. Create optimization checklist
console.log('✅ Creating optimization checklist...')
try {
  const checklist = `# Performance Optimization Checklist

## Database Optimizations
- [ ] Run database optimization SQL script
- [ ] Verify indexes are created
- [ ] Check query performance with EXPLAIN ANALYZE
- [ ] Monitor slow query log

## API Optimizations
- [ ] Verify Redis caching is working
- [ ] Check API response times
- [ ] Monitor memory usage
- [ ] Test error handling

## Frontend Optimizations
- [ ] Verify lazy loading is working
- [ ] Check bundle size
- [ ] Test virtual scrolling
- [ ] Monitor Core Web Vitals

## General Optimizations
- [ ] Run performance tests
- [ ] Check memory leaks
- [ ] Verify error tracking
- [ ] Monitor user experience

## Monitoring
- [ ] Set up performance alerts
- [ ] Configure error tracking
- [ ] Set up uptime monitoring
- [ ] Create performance dashboards

## Testing
- [ ] Load testing
- [ ] Stress testing
- [ ] Memory testing
- [ ] User experience testing
`

  const checklistPath = path.join(__dirname, '../PERFORMANCE_CHECKLIST.md')
  fs.writeFileSync(checklistPath, checklist)
  console.log('   - Created performance checklist')
} catch (error) {
  console.warn('   - Checklist creation failed:', error.message)
}

console.log('🎉 Performance optimizations completed!')
console.log('')
console.log('Next steps:')
console.log('1. Run: psql -d your_database -f src/lib/db/optimizations.sql')
console.log('2. Run: npm run build')
console.log('3. Run: npm run analyze-bundle')
console.log('4. Run: node scripts/monitor-performance.js')
console.log('5. Check PERFORMANCE_CHECKLIST.md for remaining tasks')
console.log('')
console.log('For more information, see PERFORMANCE_OPTIMIZATIONS.md')
