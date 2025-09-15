#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Patterns to replace any types
const replacements = [
  // Array types
  { pattern: /: any\[\]/g, replacement: ': unknown[]' },
  { pattern: /: any\s*\[\]/g, replacement: ': unknown[]' },
  { pattern: /Array<unknown>/g, replacement: 'Array<unknown>' },
  { pattern: /any\[\]/g, replacement: 'unknown[]' },
  
  // Function parameters
  { pattern: /\([^)]*:\s*any\s*\)/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  { pattern: /\([^)]*,\s*any\s*\)/g, replacement: (match) => match.replace(/,\s*any/g, ', unknown') },
  
  // Variable declarations
  { pattern: /let\s+\w+:\s*any\s*=/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  { pattern: /const\s+\w+:\s*any\s*=/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  { pattern: /var\s+\w+:\s*any\s*=/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  
  // Object types
  { pattern: /:\s*any\s*[;,}]/g, replacement: ': unknown' },
  { pattern: /:\s*any\s*$/gm, replacement: ': unknown' },
  
  // Generic types
  { pattern: /<unknown>/g, replacement: '<unknown>' },
  { pattern: /<unknown,/g, replacement: '<unknown,' },
  { pattern: /,unknown>/g, replacement: ',unknown>' },
  
  // Catch blocks
  { pattern: /catch\s*\(\s*[^)]*:\s*any\s*\)/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  
  // Interface properties
  { pattern: /(\w+):\s*any\s*[;,}]/g, replacement: '$1: unknown' },
  { pattern: /(\w+):\s*any\s*$/gm, replacement: '$1: unknown' },
  
  // Type assertions
  { pattern: /as\s+any\b/g, replacement: 'as unknown' },
  
  // Record types
  { pattern: /Record<string,\s*any>/g, replacement: 'Record<string, unknown>' },
  { pattern: /Record<[^,]+,\s*any>/g, replacement: (match) => match.replace(/,\s*any/g, ', unknown') },
  
  // Map types
  { pattern: /Map<[^,]+,\s*any>/g, replacement: (match) => match.replace(/,\s*any/g, ', unknown') },
  
  // Set types
  { pattern: /Set<unknown>/g, replacement: 'Set<unknown>' },
  
  // Promise types
  { pattern: /Promise<unknown>/g, replacement: 'Promise<unknown>' },
  
  // Function return types
  { pattern: /\):\s*any\s*[;{]/g, replacement: '): unknown' },
  { pattern: /\):\s*any\s*$/gm, replacement: '): unknown' },
  
  // React component props
  { pattern: /\(\s*[^)]*:\s*any\s*\)\s*=>/g, replacement: (match) => match.replace(/: any/g, ': Record<string, unknown>') },
  
  // Specific patterns for common cases
  { pattern: /useState<any\[\]>/g, replacement: 'useState<unknown[]>' },
  { pattern: /useState<unknown>/g, replacement: 'useState<unknown>' },
  { pattern: /useState<Set<unknown>>/g, replacement: 'useState<Set<unknown>>' },
  { pattern: /useState<Map<[^,]+,\s*any>>/g, replacement: (match) => match.replace(/,\s*any/g, ', unknown') },
];

// Special replacements for specific contexts
const contextReplacements = [
  // For API responses
  { pattern: /ApiResponse<unknown>/g, replacement: 'ApiResponse<unknown>' },
  { pattern: /PaginatedResponse<unknown>/g, replacement: 'PaginatedResponse<unknown>' },
  
  // For Prisma queries
  { pattern: /prisma\.\w+\.findMany<[^>]*any[^>]*>/g, replacement: (match) => match.replace(/any/g, 'unknown') },
  { pattern: /prisma\.\w+\.findFirst<[^>]*any[^>]*>/g, replacement: (match) => match.replace(/any/g, 'unknown') },
  
  // For event handlers
  { pattern: /onChange:\s*\([^)]*:\s*any\s*\)/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  { pattern: /onClick:\s*\([^)]*:\s*any\s*\)/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    // Apply general replacements
    replacements.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        changes += matches.length;
      }
    });
    
    // Apply context-specific replacements
    contextReplacements.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        changes += matches.length;
      }
    });
    
    // Special handling for specific patterns
    // Fix prefer-const issues
    newContent = newContent.replace(/let\s+(\w+):\s*Record<string,\s*unknown>\s*=\s*\{\s*deletedAt:\s*null\s*\}/g, 'const $1: Record<string, unknown> = { deletedAt: null }');
    
    // Fix unused variables
    newContent = newContent.replace(/\/\/ eslint-disable-next-line @typescript-eslint\/no-unused-vars\n\s*const\s+(\w+):\s*unknown\s*=\s*[^;]+;/g, '// $1 is intentionally unused');
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`✓ Fixed ${changes} any types in ${filePath}`, 'green');
      return changes;
    }
    
    return 0;
  } catch (error) {
    log(`✗ Error processing ${filePath}: ${error.message}`, 'red');
    return 0;
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, .next, etc.
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

function main() {
  log('🚀 Starting any type fixes...', 'cyan');
  
  const projectRoot = process.cwd();
  const files = findFiles(projectRoot);
  
  log(`📁 Found ${files.length} files to process`, 'blue');
  
  let totalChanges = 0;
  let processedFiles = 0;
  
  for (const file of files) {
    const changes = processFile(file);
    if (changes > 0) {
      totalChanges += changes;
      processedFiles++;
    }
  }
  
  log(`\n📊 Summary:`, 'magenta');
  log(`   Files processed: ${processedFiles}`, 'blue');
  log(`   Total changes: ${totalChanges}`, 'green');
  
  if (totalChanges > 0) {
    log('\n🔧 Running ESLint to check for remaining issues...', 'yellow');
    try {
      execSync('npm run lint -- --fix', { stdio: 'inherit' });
      log('✓ ESLint fixes applied', 'green');
    } catch (error) {
      log('⚠ ESLint found some issues that need manual fixing', 'yellow');
    }
    
    log('\n🔧 Running TypeScript check...', 'yellow');
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      log('✓ TypeScript check passed', 'green');
    } catch (error) {
      log('⚠ TypeScript found some issues that need manual fixing', 'yellow');
    }
  }
  
  log('\n🎉 Any type fixes completed!', 'green');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles, replacements, contextReplacements };
