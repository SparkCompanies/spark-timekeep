const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let f=fs.readFileSync(F,'utf8'),c=0;

// 1. Date picker on Issue Points in TimesheetDrilldown
var old1='onIssuePoint(emp.id,r.k)},style:{padding:"5px 10px"';
if(!f.includes(old1)){console.error('X points button not found');process.exit(1)}
f=f.replace(old1,
  'var d=prompt("Date for this violation (YYYY-MM-DD):",new Date().toISOString().slice(0,10));if(d)onIssuePoint(emp.id,r.k,undefined,d+"T12:00:00.000Z")},style:{padding:"5px 10px"'
);
c++;console.log('OK 1-date picker on issue points');

// 2. Shift dropdown in Add Employee form
// Find the unique "START" label in the add form and prepend a SHIFT TEMPLATE dropdown div
var old2='}, "START"), /*#__PURE__*/React.createElement("input", {\n    type: "time",\n    value: form.shiftStart,';
if(!f.includes(old2)){
  // Try without newlines (minified)
  old2='}, "START"), /*#__PURE__*/React.createElement("input", {type: "time",value: form.shiftStart,';
}
if(!f.includes(old2)){
  // Try finding just the label
  var idx=f.indexOf('}, "START"),');
  if(idx>0){
    // Only replace the one after addEmp
    var addEmpIdx=f.indexOf('function addEmp');
    var startIdx=f.indexOf('}, "START"),',addEmpIdx);
    if(startIdx>0){
      var before=f.substring(0,startIdx);
      var after=f.substring(startIdx);
      after=after.replace('}, "START"),',
        '}, "SHIFT TEMPLATE"), /*#__PURE__*/React.createElement("select",{value:"",onChange:function(e){var sh=SHIFTS.find(function(s){return s.k===e.target.value});if(sh)setForm(function(f2){return Object.assign({},f2,{shiftStart:sh.start,shiftEnd:sh.end})})},style:Object.assign({},inp,{appearance:"auto"})},/*#__PURE__*/React.createElement("option",{value:""},"Manual..."),SHIFTS.map(function(s){return /*#__PURE__*/React.createElement("option",{key:s.k,value:s.k},s.l+" ("+s.start+"\\u2013"+s.end+")")}))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {style:{fontSize:13,fontWeight:600,color:C.t4,fontFamily:Fb,letterSpacing:1.5,display:"block",marginBottom:3}}, "START"),'
      );
      f=before+after;
      c++;console.log('OK 2-shift dropdown replaces START label');
    }
  }
}else{
  f=f.replace(old2,
    '}, "SHIFT TEMPLATE"), /*#__PURE__*/React.createElement("select",{value:"",onChange:function(e){var sh=SHIFTS.find(function(s){return s.k===e.target.value});if(sh)setForm(function(f2){return Object.assign({},f2,{shiftStart:sh.start,shiftEnd:sh.end})})},style:Object.assign({},inp,{appearance:"auto"})},/*#__PURE__*/React.createElement("option",{value:""},"Manual..."),SHIFTS.map(function(s){return /*#__PURE__*/React.createElement("option",{key:s.k,value:s.k},s.l+" ("+s.start+"\\u2013"+s.end+")")}))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {style:{fontSize:13,fontWeight:600,color:C.t4,fontFamily:Fb,letterSpacing:1.5,display:"block",marginBottom:3}}, "START"), /*#__PURE__*/React.createElement("input", {\n    type: "time",\n    value: form.shiftStart,'
  );
  c++;console.log('OK 2-shift dropdown (exact match)');
}

if(c<2)console.log('WARNING: only '+c+' of 2 changes applied');
fs.writeFileSync(F,f,'utf8');
console.log('DONE: '+c+' changes');
