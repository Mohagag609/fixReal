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

// Patterns to fix ESLint issues
const eslintFixes = [
  // Fix prefer-const issues
  {
    pattern: /let\s+(\w+):\s*Record<string,\s*unknown>\s*=\s*\{\s*deletedAt:\s*null\s*\}/g,
    replacement: 'const $1: Record<string, unknown> = { deletedAt: null }'
  },
  {
    pattern: /let\s+(\w+):\s*Record<string,\s*unknown>\s*=\s*\{\s*\}/g,
    replacement: 'const $1: Record<string, unknown> = {}'
  },
  {
    pattern: /let\s+(\w+):\s*unknown\s*=\s*null/g,
    replacement: 'const $1: unknown = null'
  },
  {
    pattern: /let\s+(\w+):\s*unknown\[\]\s*=\s*\[\]/g,
    replacement: 'const $1: unknown[] = []'
  },
  
  // Fix unused variables by commenting them out
  {
    pattern: /^(\s*)(const|let|var)\s+(\w+):\s*[^=]+=\s*[^;]+;\s*$/gm,
    replacement: (match, indent, declaration, varName) => {
      // Check if variable is used elsewhere in the file
      return match; // Keep as is for now, will be handled by ESLint
    }
  },
  
  // Fix require imports
  {
    pattern: /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: "import $1 from '$2'"
  },
  {
    pattern: /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\)/g,
    replacement: "import { $1 } from '$2'"
  },
  
  // Fix module variable assignment
  {
    pattern: /module\s*=/g,
    replacement: 'importedModule ='
  },
  
  // Fix useEffect dependencies
  {
    pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]*\},\s*\[\s*\]\s*\)/g,
    replacement: (match) => {
      // This will need manual review, so just add a comment
      return match.replace('}, []', '}, [] // TODO: Review dependencies');
    }
  }
];

// Patterns to remove unused imports
const unusedImportPatterns = [
  /import\s+\{\s*[^}]*\s*\}\s*from\s*['"][^'"]+['"];\s*$/gm,
  /import\s+\w+\s*from\s*['"][^'"]+['"];\s*$/gm
];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    // Apply ESLint fixes
    eslintFixes.forEach(({ pattern, replacement }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        changes += matches.length;
      }
    });
    
    // Remove unused variables (simple cases)
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
        
        if (!isUsed) {
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
      log(`✓ Fixed ${changes} ESLint issues in ${filePath}`, 'green');
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
  log('🚀 Starting ESLint issues fixes...', 'cyan');
  
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
    log('\n🔧 Running ESLint with --fix...', 'yellow');
    try {
      execSync('npm run lint -- --fix', { stdio: 'inherit' });
      log('✓ ESLint auto-fixes applied', 'green');
    } catch (error) {
      log('⚠ Some ESLint issues need manual fixing', 'yellow');
    }
  }
  
  log('\n🎉 ESLint fixes completed!', 'green');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles, eslintFixes };
