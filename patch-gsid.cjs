const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let L=fs.readFileSync(F,'utf8').split('\n'),c=0;
function fi(s,f){for(let i=f||0;i<L.length;i++)if(L[i].includes(s))return i;return -1}

// 1. sbLoadEmployees: add gsId
let load=fi('badge: String(e.badge || ""),');
if(load<0){console.error('X load');process.exit(1)}
let loadFn=fi('fn: e.fn,',load);
L.splice(loadFn,0,'      gsId: e.gs_id || "",');
c++;console.log('OK 1-load gsId');

// 2. sbSaveEmployee: add gs_id
let save=fi('badge: String(e.badge || ""),',load+5);
if(save<0){console.error('X save');process.exit(1)}
let saveFn=fi('fn: e.fn,',save);
L.splice(saveFn,0,'    gs_id: e.gsId || "",');
c++;console.log('OK 2-save gs_id');

// 3. startEdit: add gsId
let se=fi('function startEdit(e)');
L[se]=L[se].replace('pin:e.pin,','pin:e.pin,gsId:e.gsId||"",');
c++;console.log('OK 3-startEdit');

// 4. saveEdit: add gsId
let sv=fi('function saveEdit()');
L[sv]=L[sv].replace('pin:editForm.pin||x.pin,','pin:editForm.pin||x.pin,gsId:editForm.gsId||x.gsId||"",');
c++;console.log('OK 4-saveEdit');

// 5. CSV exports: add GS ID to all 4 headers and data
// Timesheet
let h1=fi('"Employee,Badge,Dept,Title,Mon Net');
if(h1>=0){L[h1]=L[h1].replace('"Employee,Badge,','"Employee,GS ID,Badge,');c++;console.log('OK 5a-timesheet header')}
let d1=fi('.badge + ","+',fi('doExport'));
if(d1>=0){L[d1]=L[d1].replace('.badge + ","','.badge + ","+ (e.gsId||"") + ","');c++;console.log('OK 5b-timesheet data')}

// Points
let h2=fi('"Employee,Badge,Type,Points,Date"');
if(h2>=0){L[h2]=L[h2].replace('"Employee,Badge,','"Employee,GS ID,Badge,');c++;console.log('OK 5c-points header')}
let d2=fi('emp ? emp.badge : "?"',fi('"points"'));
if(d2>=0){L[d2]=L[d2].replace('emp ? emp.badge : "?"','(emp?emp.gsId||"":"") + "," + (emp ? emp.badge : "?")');c++;console.log('OK 5d-points data')}

// Detailed
let h3=fi('"Employee,Badge,Dept,Shift,Date,Clock In');
if(h3>=0){L[h3]=L[h3].replace('"Employee,Badge,','"Employee,GS ID,Badge,');c++;console.log('OK 5e-detailed header')}
let d3=fi('e.fn+" "+e.ln+","+e.badge+","',fi('"detailed"'));
if(d3>=0){L[d3]=L[d3].replace('e.fn+" "+e.ln+","+e.badge+","','e.fn+" "+e.ln+","+(e.gsId||"")+","+e.badge+","');c++;console.log('OK 5f-detailed data')}

// Audit
let h4=fi('"Employee,Badge,Type,Time,Device');
if(h4>=0){L[h4]=L[h4].replace('"Employee,Badge,','"Employee,GS ID,Badge,');c++;console.log('OK 5g-audit header')}
let d4=fi('emp ? emp.badge : "?"',fi('"audit"'));
if(d4>=0){L[d4]=L[d4].replace('emp ? emp.badge : "?"','(emp?emp.gsId||"":"") + "," + (emp ? emp.badge : "?")');c++;console.log('OK 5h-audit data')}

// 6. Edit modal: add GS ID field after Badge field
let badgeEdit=fi('"Badge"),');
if(badgeEdit>=0){
  let badgeInput=fi('editForm.badge',badgeEdit);
  if(badgeInput>=0){
    let endOfBadge=fi('}}))',badgeInput);
    if(endOfBadge>=0){
      L[endOfBadge]=L[endOfBadge]+'\n  /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div",{style:{fontSize:13,color:C.t4,marginBottom:4}},"GS ID"), /*#__PURE__*/React.createElement("input",{value:editForm.gsId||"",onChange:function(ev){setEditForm(Object.assign({},editForm,{gsId:ev.target.value}))},placeholder:"Greenshades ID",style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px 10px",borderRadius:6,fontSize:14,fontFamily:Fm,outline:"none"}})),';
      c++;console.log('OK 6-edit modal GS ID field');
    }
  }
}

// 7. Admin table: add GS ID column header and cell
let tableHeaders=fi('["Badge", "Name", "PIN"');
if(tableHeaders>=0){
  L[tableHeaders]=L[tableHeaders].replace('["Badge", "Name", "PIN"','["Badge", "GS ID", "Name", "PIN"');
  c++;console.log('OK 7a-table header');
}
// Add GS ID cell after badge cell in table body
let badgeCell=fi('e.badge)), /*#__PURE__*/React.createElement("td"');
if(badgeCell>=0){
  L[badgeCell]=L[badgeCell].replace(
    'e.badge)), /*#__PURE__*/React.createElement("td"',
    'e.badge)), /*#__PURE__*/React.createElement("td",{style:{padding:"8px 12px",fontFamily:Fm,fontSize:13,color:C.t3}},e.gsId||"-"), /*#__PURE__*/React.createElement("td"'
  );
  c++;console.log('OK 7b-table cell');
}

fs.writeFileSync(F,L.join('\n'),'utf8');
console.log('\nDONE: '+c+' changes');
console.log('\nSupabase: add column gs_id (text, default empty) to tk_employees');
