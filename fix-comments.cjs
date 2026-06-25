const fs=require('fs'),p=require('path');
let f=fs.readFileSync(p.join(__dirname,'index.html'),'utf8');
let count=0;
f=f.replace(/\/\/\s*──[^,)}\]]*──\s*/g,function(){count++;return ''});
f=f.replace(/\/\/\s*──[^\n]*/g,function(){count++;return ''});
fs.writeFileSync(p.join(__dirname,'index.html'),f,'utf8');
console.log('Removed '+count+' inline comments');
