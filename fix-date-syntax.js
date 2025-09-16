const fs = require('fs');
const path = require('path');

// قائمة الملفات التي تحتوي على أخطاء التاريخ
const filesToFix = [
  'src/app/brokers/page.tsx',
  'src/app/contracts/page.tsx',
  'src/app/customers/page.tsx',
  'src/app/installments/page.tsx',
  'src/app/reports/builder/fields.ts',
  'src/app/reports/page.tsx',
  'src/app/units/page.tsx',
  'src/components/BackupSystem.tsx',
  'src/components/OptimizedExport.tsx'
];

// إصلاح أخطاء التاريخ
function fixDateSyntax(content) {
  // إصلاح new Date()??.toISOString()
  content = content.replace(/new Date\(\)\?\?\.toISOString\(\)/g, 'new Date().toISOString()');
  
  // إصلاح new Date(...)??.toISOString()
  content = content.replace(/new Date\([^)]*\)\?\?\.toISOString\(\)/g, (match) => {
    return match.replace(/\?\?\.toISOString\(\)/, '.toISOString()');
  });
  
  return content;
}

// إصلاح الفواصل المفقودة في useEffect
function fixUseEffectCommas(content) {
  // إصلاح }, [] // TODO: Review dependencies) // TODO: Review dependencies
  content = content.replace(/}, \[\] \/\/ TODO: Review dependencies\) \/\/ TODO: Review dependencies/g, '}, []) // TODO: Review dependencies');
  
  return content;
}

// معالجة كل ملف
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`إصلاح ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // إصلاح أخطاء التاريخ
    content = fixDateSyntax(content);
    
    // إصلاح الفواصل المفقودة
    content = fixUseEffectCommas(content);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`تم إصلاح ${filePath}`);
  } else {
    console.log(`الملف غير موجود: ${filePath}`);
  }
});

console.log('تم إصلاح جميع أخطاء التاريخ والفواصل!');
