const fs = require('fs');
const s = fs.readFileSync('src/app/reports/page.tsx','utf8');
const lines = s.split(/\r?\n/);
console.log('LINE66_RAW:', JSON.stringify(lines[65] || ''));
console.log('LINE66_HEX:', Buffer.from(lines[65] || '', 'utf8').toString('hex'));
console.log('LINES_60_70:');
for (let i = 59; i < 71; i++) console.log(i+1, JSON.stringify(lines[i]||''));
