const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files that import from lib/prisma.ts
const files = glob.sync('src/**/*.ts', { cwd: __dirname });

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file imports from lib/prisma.ts
    if (content.includes("from '") && content.includes("lib/prisma.ts'")) {
      // Remove .ts extension
      content = content.replace(/lib\/prisma\.ts'/g, "lib/prisma'");
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  }
});

console.log('🎉 All Prisma imports fixed!');