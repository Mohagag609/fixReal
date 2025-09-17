const fs = require('fs');
const path = require('path');

const filesToFix = [
  'new-accounting-system/src/app/api/installments/[id]/route.ts',
  'new-accounting-system/src/app/api/units/[id]/route.ts',
  'new-accounting-system/src/app/api/partners/[id]/route.ts',
  'new-accounting-system/src/app/api/customers/[id]/route.ts',
  'new-accounting-system/src/app/api/transfers/[id]/route.ts',
  'new-accounting-system/src/app/api/transfers/route.ts',
  'new-accounting-system/src/app/api/contracts/route.ts',
  'new-accounting-system/src/app/api/units/route.ts',
  'new-accounting-system/src/app/api/vouchers/route.ts',
  'new-accounting-system/src/app/api/installments/route.ts',
  'new-accounting-system/src/app/api/customers/route.ts',
  'new-accounting-system/src/app/api/partners/route.ts',
  'new-accounting-system/src/app/api/safes/route.ts'
];

function fixZodErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace error.errors with error.issues
    content = content.replace(/error\.errors/g, 'error.issues');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixZodErrors);
console.log('All Zod error references fixed!');