const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files that import from @/lib/prisma
const files = glob.sync('src/**/*.ts', { cwd: __dirname });

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file imports from @/lib/prisma
    if (content.includes("from '@/lib/prisma'")) {
      // Calculate relative path to lib/prisma.ts
      const dir = path.dirname(fullPath);
      const relativePath = path.relative(dir, path.join(__dirname, 'src/lib/prisma.ts'));
      
      // Replace the import
      content = content.replace(
        "from '@/lib/prisma'",
        `from '${relativePath.replace(/\\/g, '/')}'`
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath} -> ${relativePath}`);
    }
  }
});

console.log('🎉 All Prisma imports fixed!');