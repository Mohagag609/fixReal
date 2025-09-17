const fs = require('fs');
const path = require('path');

const dynamicRoutes = [
  'src/app/api/brokers/[id]/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/installments/[id]/route.ts',
  'src/app/api/partners/[id]/route.ts',
  'src/app/api/transfers/[id]/route.ts',
  'src/app/api/units/[id]/route.ts'
];

dynamicRoutes.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if generateStaticParams already exists
    if (!content.includes('generateStaticParams')) {
      // Add generateStaticParams after dynamic export
      const dynamicIndex = content.indexOf('export const dynamic');
      const nextLineIndex = content.indexOf('\n', dynamicIndex) + 1;
      
      const generateStaticParams = `
export async function generateStaticParams() {
  // Return empty array for static generation
  return [];
}
`;
      
      content = content.slice(0, nextLineIndex) + 
                generateStaticParams + 
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

console.log('🎉 All dynamic routes fixed!');