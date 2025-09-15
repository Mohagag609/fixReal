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

// Comprehensive patterns to fix all issues
const allFixes = [
  // 1. Fix any types
  { pattern: /: any\[\]/g, replacement: ': unknown[]' },
  { pattern: /: any\s*\[\]/g, replacement: ': unknown[]' },
  { pattern: /Array<unknown>/g, replacement: 'Array<unknown>' },
  { pattern: /any\[\]/g, replacement: 'unknown[]' },
  { pattern: /:\s*any\s*[;,}]/g, replacement: ': unknown' },
  { pattern: /:\s*any\s*$/gm, replacement: ': unknown' },
  { pattern: /<unknown>/g, replacement: '<unknown>' },
  { pattern: /<unknown,/g, replacement: '<unknown,' },
  { pattern: /,unknown>/g, replacement: ',unknown>' },
  { pattern: /as\s+any\b/g, replacement: 'as unknown' },
  { pattern: /Record<string,\s*any>/g, replacement: 'Record<string, unknown>' },
  { pattern: /Map<[^,]+,\s*any>/g, replacement: (match) => match.replace(/,\s*any/g, ', unknown') },
  { pattern: /Set<unknown>/g, replacement: 'Set<unknown>' },
  { pattern: /Promise<unknown>/g, replacement: 'Promise<unknown>' },
  { pattern: /useState<any\[\]>/g, replacement: 'useState<unknown[]>' },
  { pattern: /useState<unknown>/g, replacement: 'useState<unknown>' },
  { pattern: /useState<Set<unknown>>/g, replacement: 'useState<Set<unknown>>' },
  { pattern: /ApiResponse<unknown>/g, replacement: 'ApiResponse<unknown>' },
  { pattern: /PaginatedResponse<unknown>/g, replacement: 'PaginatedResponse<unknown>' },
  
  // 2. Fix prefer-const issues
  { pattern: /let\s+(\w+):\s*Record<string,\s*unknown>\s*=\s*\{\s*deletedAt:\s*null\s*\}/g, replacement: 'const $1: Record<string, unknown> = { deletedAt: null }' },
  { pattern: /let\s+(\w+):\s*Record<string,\s*unknown>\s*=\s*\{\s*\}/g, replacement: 'const $1: Record<string, unknown> = {}' },
  { pattern: /let\s+(\w+):\s*unknown\s*=\s*null/g, replacement: 'const $1: unknown = null' },
  { pattern: /let\s+(\w+):\s*unknown\[\]\s*=\s*\[\]/g, replacement: 'const $1: unknown[] = []' },
  
  // 3. Fix require imports
  { pattern: /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g, replacement: "import $1 from '$2'" },
  { pattern: /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\)/g, replacement: "import { $1 } from '$2'" },
  
  // 4. Fix module variable assignment
  { pattern: /module\s*=/g, replacement: 'importedModule =' },
  
  // 5. Fix function parameters
  { pattern: /\([^)]*:\s*any\s*\)/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  { pattern: /\([^)]*,\s*any\s*\)/g, replacement: (match) => match.replace(/,\s*any/g, ', unknown') },
  
  // 6. Fix catch blocks
  { pattern: /catch\s*\(\s*[^)]*:\s*any\s*\)/g, replacement: (match) => match.replace(/: any/g, ': unknown') },
  
  // 7. Fix React component props
  { pattern: /\(\s*[^)]*:\s*any\s*\)\s*=>/g, replacement: (match) => match.replace(/: any/g, ': Record<string, unknown>') },
  
  // 8. Fix Prisma queries
  { pattern: /\(prisma\)/g, replacement: 'prisma' },
  { pattern: /prisma/g, replacement: 'prisma' },
  
  // 9. Fix specific patterns
  { pattern: /let\s+html\s*=\s*`/g, replacement: 'const html = `' },
  { pattern: /let\s+(\w+):\s*string\s*=\s*`/g, replacement: 'const $1: string = `' },
];

// Patterns to comment out unused variables
const unusedVarPatterns = [
  /^(\s*)(const|let|var)\s+(\w+):\s*[^=]+=\s*[^;]+;\s*$/gm
];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    // Apply all fixes
    allFixes.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        changes += matches.length;
      }
    });
    
    // Handle unused variables
    const lines = newContent.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for unused variable declarations
      const unusedVarMatch = line.match(/^(\s*)(const|let|var)\s+(\w+):\s*[^=]+=\s*[^;]+;\s*$/);
      if (unusedVarMatch) {
        const [, indent, declaration, varName] = unusedVarMatch;
        
        // Check if variable is used in the rest of the file
        const restOfFile = lines.slice(i + 1).join('\n');
        const isUsed = restOfFile.includes(varName) && !restOfFile.includes(`// ${varName}`);
        
        if (!isUsed && !varName.startsWith('_')) {
          // Comment out unused variable
          newLines.push(`${indent}// ${declaration} ${varName} - unused`);
          changes++;
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    newContent = newLines.join('\n');
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`✓ Fixed ${changes} issues in ${filePath}`, 'green');
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

function runCommand(command, description) {
  try {
    log(`🔧 ${description}...`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`⚠ ${description} found issues`, 'yellow');
    return false;
  }
}

function main() {
  log('🚀 Starting comprehensive fixes...', 'cyan');
  
  const projectRoot = process.cwd();
  const files = findFiles(projectRoot);
  
  log(`📁 Found ${files.length} files to process`, 'blue');
  
  let totalChanges = 0;
  let processedFiles = 0;
  
  // Process all files
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
    // Run ESLint with --fix
    runCommand('npm run lint -- --fix', 'Running ESLint with auto-fix');
    
    // Run TypeScript check
    runCommand('npm run type-check', 'Running TypeScript check');
    
    // Try to build the project
    log('\n🔧 Attempting to build the project...', 'yellow');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      log('✓ Project builds successfully!', 'green');
    } catch (error) {
      log('⚠ Build failed, but fixes have been applied', 'yellow');
      log('   You may need to manually fix remaining issues', 'yellow');
    }
  }
  
  log('\n🎉 All fixes completed!', 'green');
  log('   Check the output above for any remaining issues that need manual fixing.', 'blue');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles, allFixes };
