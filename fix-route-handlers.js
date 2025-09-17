const fs = require('fs');
const path = require('path');

const filesToFix = [
  'new-accounting-system/src/app/api/transfers/[id]/route.ts',
  'new-accounting-system/src/app/api/units/[id]/route.ts',
  'new-accounting-system/src/app/api/partners/[id]/route.ts',
  'new-accounting-system/src/app/api/customers/[id]/route.ts',
  'new-accounting-system/src/app/api/installments/[id]/route.ts'
];

function fixRouteHandler(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the params type definition
    content = content.replace(
      /{ params }: { params: { id: string } }/g,
      '{ params }: { params: Promise<{ id: string }> }'
    );
    
    // Fix the usage of params.id to await params and destructure id
    content = content.replace(
      /export async function (GET|PUT|DELETE)\(\s*request: NextRequest,\s*{ params }: { params: Promise<{ id: string }> }\s*\)\s*{([\s\S]*?)(?=export|$)/g,
      (match, method, body) => {
        // Add const { id } = await params at the beginning of the function body
        const newBody = body.replace(
          /try\s*{/,
          'try {\n    const { id } = await params'
        );
        
        // Replace all instances of params.id with id
        const fixedBody = newBody.replace(/params\.id/g, 'id');
        
        return `export async function ${method}(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {${fixedBody}`;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixRouteHandler);
console.log('All route handlers fixed!');