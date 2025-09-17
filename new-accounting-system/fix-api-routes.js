const fs = require('fs');
const path = require('path');

const apiRoutes = [
  'src/app/api/brokers/[id]/route.ts',
  'src/app/api/contracts/route.ts',
  'src/app/api/customers/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/installments/route.ts',
  'src/app/api/installments/[id]/route.ts',
  'src/app/api/partners/route.ts',
  'src/app/api/partners/[id]/route.ts',
  'src/app/api/reports/dashboard/route.ts',
  'src/app/api/safes/route.ts',
  'src/app/api/transfers/route.ts',
  'src/app/api/transfers/[id]/route.ts',
  'src/app/api/units/route.ts',
  'src/app/api/units/[id]/route.ts',
  'src/app/api/vouchers/route.ts'
];

apiRoutes.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if dynamic export already exists
    if (!content.includes('export const dynamic')) {
      // Add dynamic export after imports
      const importEndIndex = content.lastIndexOf('import');
      const nextLineIndex = content.indexOf('\n', importEndIndex) + 1;
      
      content = content.slice(0, nextLineIndex) + 
                '\nexport const dynamic = \'force-static\'\n' + 
                content.slice(nextLineIndex);
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${routePath}`);
    } else {
      console.log(`⏭️  Already fixed: ${routePath}`);
    }
  } else {
    console.log(`❌ Not found: ${routePath}`);
  }
});

console.log('🎉 All API routes fixed!');