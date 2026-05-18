const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let L=fs.readFileSync(F,'utf8').split('\n'),c=0;
function fi(s,f){for(let i=f||0;i<L.length;i++)if(L[i].includes(s))return i;return -1}
function ok(l){c++;console.log('OK '+l)}
function no(l){console.error('X '+l);process.exit(1)}

// 1. calcDayHours: add eid param
let i=fi('function calcDayHours(punches)');if(i<0)no('1');
L[i]=L[i].replace('function calcDayHours(punches)','function calcDayHours(punches, eid)');ok('1-eid param');

// 2. breakMs: add exempt check
i=fi('var breakMs = (grossH');if(i<0)no('2');
L[i]='  var _bex=eid&&window.__breakExemptEids&&window.__breakExemptEids[eid]; var breakMs=_bex?0:(grossH>=(window.__breakReqHrs||8))?(window.__breakMins||30)*60000:0;';ok('2-exempt check');

// 3-6. Wrapper functions: pass eid through
['function calcWeekHours','function calcWeekHoursForWeek','function getDailyBreakdown','function getDailyBreakdownForWeek'].forEach(function(fn,idx){
  let s=fi(fn);if(s<0)no('wrap-'+idx);
  let x=fi('calcDayHours(dp)',s);if(x<0)no('wrap-call-'+idx);
  L[x]=L[x].replace('calcDayHours(dp)','calcDayHours(dp,eid)');ok((3+idx)+'-'+fn.split(' ')[1]);
});

// 7. ReportsTab direct call
i=fi('calcDayHours(getDayPunchesWithCarryOver(punches,e.id,ds,de))');if(i<0)no('7');
L[i]=L[i].replace('calcDayHours(getDayPunchesWithCarryOver(punches,e.id,ds,de))','calcDayHours(getDayPunchesWithCarryOver(punches,e.id,ds,de),e.id)');ok('7-reports');

// 8. ManagerView timesheet
i=fi('return calcDayHours(dp);');if(i<0)no('8');
L[i]=L[i].replace('return calcDayHours(dp);','return calcDayHours(dp,e.id);');ok('8-timesheet');

// 9. Admin export
i=fi('var hrs=calcDayHours(dp);');if(i<0)no('9');
L[i]=L[i].replace('var hrs=calcDayHours(dp);','var hrs=calcDayHours(dp,e.id);');ok('9-export');

// 10. sbLoadEmployees: add breakExempt
i=fi('salary: parseFloat(e.salary) || 0');if(i<0)no('10');
L[i]=L[i].replace('salary: parseFloat(e.salary) || 0','salary: parseFloat(e.salary) || 0,\n      breakExempt: !!e.break_exempt');ok('10-load');

// 11. sbSaveEmployee: add break_exempt
i=fi('salary: e.salary || 0,');if(i<0)no('11');
L.splice(i+1,0,'    break_exempt: e.breakExempt || false,');ok('11-save');

// 12. Global registry useEffect
i=fi('function persist(ne, npe');if(i<0)no('12');
L.splice(i,0,'  useEffect(function(){window.__breakExemptEids={};emps.forEach(function(e){if(e.breakExempt)window.__breakExemptEids[e.id]=true});},[ emps]);');ok('12-registry');

// 13. startEdit: add breakExempt
i=fi('pin:e.pin}); setEditEmp2');if(i<0)i=fi('pin:e.pin})');if(i<0)no('13');
L[i]=L[i].replace('pin:e.pin})','pin:e.pin,breakExempt:e.breakExempt||false})');ok('13-startEdit');

// 14. saveEdit: add breakExempt
i=fi('pin:editForm.pin||x.pin})');if(i<0)no('14');
L[i]=L[i].replace('pin:editForm.pin||x.pin})','pin:editForm.pin||x.pin,breakExempt:editForm.breakExempt!==undefined?editForm.breakExempt:x.breakExempt})');ok('14-saveEdit');

// 15. Edit modal UI: add toggle before Save/Cancel buttons
i=fi('"Save Changes")');if(i<0)no('15');
let btn=i;for(let j=i;j>=i-5;j--){if(L[j].includes('gap:8,marginTop:16')){btn=j;break}}
L.splice(btn,0,'  React.createElement("div",{style:{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:10,marginTop:8,padding:"10px 12px",background:editForm.breakExempt?"rgba(250,204,21,0.08)":"transparent",border:"1px solid "+(editForm.breakExempt?"rgba(250,204,21,0.25)":"#1E1E22"),borderRadius:8}},React.createElement("input",{type:"checkbox",checked:editForm.breakExempt||false,onChange:function(ev){setEditForm(Object.assign({},editForm,{breakExempt:ev.target.checked}))},style:{accentColor:"#FACC15",width:18,height:18,cursor:"pointer"}}),React.createElement("div",null,React.createElement("div",{style:{fontSize:14,fontWeight:600,color:editForm.breakExempt?"#FACC15":"#A1A1AA"}},"Lunch Break Exempt"),React.createElement("div",{style:{fontSize:12,color:"#3F3F46"}},editForm.breakExempt?"No auto 30-min lunch deduction":"Standard auto lunch deduction applies"))),');ok('15-editUI');

// 16. Add form initial state: breakExempt
i=fi('salary: 0',fi('function AdminView'));if(i<0)no('16');
if(!L[i].includes('breakExempt'))L[i]=L[i].replace('salary: 0','salary: 0,\n      breakExempt: false');ok('16-formInit');

// 17. addEmp: include breakExempt
i=fi('salary: parseFloat(form.salary) || 0,',fi('function addEmp'));if(i<0)no('17');
L.splice(i+1,0,'      breakExempt: form.breakExempt || false,');ok('17-addEmp');

// 18. Form reset after addEmp: include breakExempt
i=fi('hireDate: ""',fi('function addEmp'));
if(i>=0){for(let j=i;j>=i-5;j--){if(L[j].includes('salary: 0')&&!L[j].includes('breakExempt')){L[j]=L[j].replace('salary: 0','salary: 0,\n      breakExempt: false');ok('18-formReset');break}}}

fs.writeFileSync(F,L.join('\n'),'utf8');
console.log('\nDONE: '+c+' changes applied');
console.log('\nIMPORTANT: Add column in Supabase first!');
console.log('  Go to Supabase > Table Editor > tk_employees');
console.log('  Add column: break_exempt (type: bool, default: false)');
console.log('\nThen deploy:');
console.log('  git add -A && git commit -m "Add break exempt per employee" && git push');
