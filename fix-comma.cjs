const fs=require('fs'),p=require('path');
let f=fs.readFileSync(p.join(__dirname,'index.html'),'utf8');
f=f.replace('onSwitchView\n  shiftTemplates,','onSwitchView,\n  shiftTemplates,');
fs.writeFileSync(p.join(__dirname,'index.html'),f,'utf8');
console.log('OK - comma fixed');
