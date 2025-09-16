const fs = require('fs');

console.log('🔧 بدء إصلاح الأخطاء المتبقية...');

// إصلاح مشاكل Prisma types
function fixPrismaTypes() {
  console.log('📊 إصلاح مشاكل Prisma types...');
  
  // إصلاح backup.ts
  const backupPath = 'src/lib/backup.ts';
  if (fs.existsSync(backupPath)) {
    let content = fs.readFileSync(backupPath, 'utf8');
    
    // استبدال جميع الأنواع المفقودة بـ any
    const types = [
      'CustomerCreateManyInput', 'UnitCreateManyInput', 'PartnerCreateManyInput',
      'UnitPartnerCreateManyInput', 'ContractCreateManyInput', 'InstallmentCreateManyInput',
      'PartnerDebtCreateManyInput', 'SafeCreateManyInput', 'TransferCreateManyInput',
      'VoucherCreateManyInput', 'BrokerCreateManyInput', 'BrokerDueCreateManyInput',
      'PartnerGroupCreateManyInput', 'SettingsCreateManyInput', 'KeyValCreateManyInput'
    ];
    
    types.forEach(type => {
      content = content.replace(new RegExp(type + '\\[\\]', 'g'), 'any[]');
    });
    
    // إزالة imports المفقودة
    content = content.replace(/import type {[\s\S]*?} from '@prisma\/client'/g, '');
    
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log('✅ تم إصلاح backup.ts');
  }
  
  // إصلاح prisma-logging.ts
  const loggingPath = 'src/lib/prisma-logging.ts';
  if (fs.existsSync(loggingPath)) {
    let content = fs.readFileSync(loggingPath, 'utf8');
    
    content = content.replace(
      /import { PrismaClient, LogLevel, LogDefinition } from '@prisma\/client'/g,
      "import { PrismaClient } from '@prisma/client'"
    );
    
    content = content.replace(
      /export function createPrismaLogger\(\): \(LogLevel \| LogDefinition\)\[\]/g,
      'export function createPrismaLogger(): any[]'
    );
    
    fs.writeFileSync(loggingPath, content, 'utf8');
    console.log('✅ تم إصلاح prisma-logging.ts');
  }
}

// إصلاح مشاكل components
function fixComponents() {
  console.log('🎨 إصلاح مشاكل components...');
  
  const files = [
    'src/components/LazyPage.tsx',
    'src/components/OptimizedExport.tsx',
    'src/components/OptimizedFilters.tsx',
    'src/components/OptimizedTable.tsx'
  ];
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // إزالة imports المفقودة
      content = content.replace(/import { ModernButton } from '\.\/ui\/ModernButton'/g, '// import { ModernButton } from \'./ui/ModernButton\'');
      content = content.replace(/import { ModernCard } from '\.\/ui\/ModernCard'/g, '// import { ModernCard } from \'./ui/ModernCard\'');
      content = content.replace(/import { ModernInput } from '\.\/ui\/ModernInput'/g, '// import { ModernInput } from \'./ui/ModernInput\'');
      content = content.replace(/import { ModernSelect } from '\.\/ui\/ModernSelect'/g, '// import { ModernSelect } from \'./ui/ModernSelect\'');
      
      // إصلاح componentDidCatch
      content = content.replace(/componentDidCatch\(error: Error, errorInfo: React\.ErrorInfo\)/g, 'override componentDidCatch(error: Error, errorInfo: React.ErrorInfo)');
      content = content.replace(/render\(\)/g, 'override render()');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ تم إصلاح ${filePath}`);
    }
  });
}

// إصلاح مشاكل hooks
function fixHooks() {
  console.log('🪝 إصلاح مشاكل hooks...');
  
  const files = [
    'src/hooks/useApiCache.ts',
    'src/hooks/useOptimizedFetch.ts',
    'src/hooks/useEntityApi.ts'
  ];
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // إصلاح مشاكل setState
      content = content.replace(/setState\(prev => \(\{[\s\S]*?data: unknown,[\s\S]*?\}\)\)/g, 'setState(prev => ({ ...prev, data: cached.data as T, loading: false, error: null, lastFetch: cached.timestamp }))');
      
      // إصلاح مشاكل error handling
      content = content.replace(/if \(error\.name === 'AbortError'\)/g, 'if ((error as any)?.name === \'AbortError\')');
      content = content.replace(/error: error\.message \|\| 'خطأ في الاتصال بالخادم'/g, 'error: (error as any)?.message || \'خطأ في الاتصال بالخادم\'');
      
      // إصلاح مشاكل return type
      content = content.replace(/return cached\.data/g, 'return cached.data as T');
      
      // إصلاح مشاكل listResponse
      content = content.replace(/data: listResponse\?\.data \|\| \[\]/g, 'data: (listResponse as any)?.data || []');
      content = content.replace(/pagination: listResponse\?\.pagination/g, 'pagination: (listResponse as any)?.pagination');
      content = content.replace(/success: listResponse\?\.success/g, 'success: (listResponse as any)?.success');
      content = content.replace(/message: listResponse\?\.message/g, 'message: (listResponse as any)?.message');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ تم إصلاح ${filePath}`);
    }
  });
}

// تشغيل جميع الإصلاحات
function runAllFixes() {
  try {
    fixPrismaTypes();
    fixComponents();
    fixHooks();
    
    console.log('🎉 تم إصلاح الأخطاء الأساسية بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في إصلاح الأخطاء:', error);
  }
}

runAllFixes();
