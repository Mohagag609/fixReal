const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const files = glob.sync('src/app/api/**/route.ts', { cwd: __dirname });

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Check for GET function with unused request parameter
    if (content.includes('export async function GET(') && 
        content.includes('request: NextRequest,') && 
        !content.includes('request.')) {
      
      // Remove request parameter from GET function
      content = content.replace(
        /export async function GET\(\s*request: NextRequest,\s*\{ params \}: \{ params: Promise<\{ id: string \} \} \}/g,
        'export async function GET(\n  { params }: { params: Promise<{ id: string }> }'
      );
      
      // Also handle the case without id parameter
      content = content.replace(
        /export async function GET\(\s*request: NextRequest,\s*\)/g,
        'export async function GET()'
      );
      
      modified = true;
    }
    
    // Check for PUT function with unused request parameter
    if (content.includes('export async function PUT(') && 
        content.includes('request: NextRequest,') && 
        !content.includes('request.')) {
      
      content = content.replace(
        /export async function PUT\(\s*request: NextRequest,\s*\{ params \}: \{ params: Promise<\{ id: string \} \} \}/g,
        'export async function PUT(\n  { params }: { params: Promise<{ id: string }> }'
      );
      
      modified = true;
    }
    
    // Check for DELETE function with unused request parameter
    if (content.includes('export async function DELETE(') && 
        content.includes('request: NextRequest,') && 
        !content.includes('request.')) {
      
      content = content.replace(
        /export async function DELETE\(\s*request: NextRequest,\s*\{ params \}: \{ params: Promise<\{ id: string \} \} \}/g,
        'export async function DELETE(\n  { params }: { params: Promise<{ id: string }> }'
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  }
});

console.log('🎉 All unused request parameters fixed!');