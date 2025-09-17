// Simple start script for demo
const { spawn } = require('child_process');

console.log('🚀 Starting Real Estate Management System...');
console.log('📦 Building project...');

const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' });

build.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully!');
    console.log('🌟 Starting server...');
    
    const server = spawn('npm', ['start'], { stdio: 'inherit' });
    
    server.on('close', (serverCode) => {
      console.log(`Server exited with code ${serverCode}`);
    });
  } else {
    console.log(`❌ Build failed with code ${code}`);
  }
});