const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let L=fs.readFileSync(F,'utf8').split('\n'),c=0;
function fi(s,f){for(let i=f||0;i<L.length;i++)if(L[i].includes(s))return i;return -1}

// 1. Issue Points with date picker in TimesheetDrilldown
let ip=fi('onIssuePoint(emp.id,r.k)},style:{padding:"5px 10px"');
if(ip<0){console.error('X points button');process.exit(1)}
L[ip]=L[ip].replace(
  'onIssuePoint(emp.id,r.k)',
  'var d=prompt("Date for this violation (YYYY-MM-DD):",new Date().toISOString().slice(0,10));if(d)onIssuePoint(emp.id,r.k,undefined,d+"T12:00:00.000Z")'
);
c++;console.log('OK 1-date picker on issue points');

// 2. Add shift template dropdown to Add Employee form (before START field)
let startLabel=fi('"START"), /*#__PURE__*/React.createElement("input"',fi('function addEmp'));
if(startLabel<0){console.error('X start label');process.exit(1)}
// Walk back to find the parent div
for(let i=startLabel;i>=startLabel-5;i--){
  if(L[i].includes('React.createElement("div", null, /*#__PURE__*/React.createElement("label"') && L[i+3] && L[i+3].includes('"START"')){
    // Insert shift dropdown div before this div
    L.splice(i,0,
      '/*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {style:{fontSize:13,fontWeight:600,color:C.t4,fontFamily:Fb,letterSpacing:1.5,display:"block",marginBottom:3}},"SHIFT TEMPLATE"), /*#__PURE__*/React.createElement("select",{value:"",onChange:function(e){var sh=SHIFTS.find(function(s){return s.k===e.target.value});if(sh)setForm(function(f){return Object.assign({},f,{shiftStart:sh.start,shiftEnd:sh.end})})},style:Object.assign({},inp,{appearance:"auto"})},/*#__PURE__*/React.createElement("option",{value:""},"Manual..."),SHIFTS.map(function(s){return /*#__PURE__*/React.createElement("option",{key:s.k,value:s.k},s.l+" ("+s.start+"\\u2013"+s.end+")")}))), '
    );
    c++;console.log('OK 2-shift dropdown in add employee');
    break;
  }
}
// If the above pattern didn't match, try alternate approach
if(c<2){
  let startLine=fi('"START")',fi('function addEmp'));
  if(startLine>=0){
    for(let i=startLine;i>=startLine-10;i--){
      if(L[i].includes('React.createElement("div", null,')){
        L.splice(i,0,
          'React.createElement("div", null, React.createElement("label", {style:{fontSize:13,fontWeight:600,color:C.t4,fontFamily:Fb,letterSpacing:1.5,display:"block",marginBottom:3}},"SHIFT TEMPLATE"), React.createElement("select",{value:"",onChange:function(e){var sh=SHIFTS.find(function(s){return s.k===e.target.value});if(sh)setForm(function(f){return Object.assign({},f,{shiftStart:sh.start,shiftEnd:sh.end})})},style:Object.assign({},inp,{appearance:"auto"})},React.createElement("option",{value:""},"Manual..."),SHIFTS.map(function(s){return React.createElement("option",{key:s.k,value:s.k},s.l+" ("+s.start+"\\u2013"+s.end+")")}))), '
        );
        c++;console.log('OK 2-shift dropdown (alt)');
        break;
      }
    }
  }
}

fs.writeFileSync(F,L.join('\n'),'utf8');
console.log('\nDONE: '+c+' changes');
console.log('Deploy: git add -A && git commit -m "Add date picker for points + shift dropdown for new employees" && git push');
