const fs=require('fs'),p=require('path');
let f=fs.readFileSync(p.join(__dirname,'index.html'),'utf8');
f=f.replace(
  'e.fn + " " + e.ln + "," + e.badge + "," + (e.dept||"")',
  'e.fn + " " + e.ln + "," + (e.gsId||"") + "," + e.badge + "," + (e.dept||"")'
);
fs.writeFileSync(p.join(__dirname,'index.html'),f,'utf8');
console.log('OK - timesheet CSV GS ID added');
