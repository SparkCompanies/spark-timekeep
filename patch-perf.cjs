const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let f=fs.readFileSync(F,'utf8'),c=0;

// 1. Import useMemo
var old1='const {\n  useState,\n  useEffect,\n  useCallback,\n  useRef\n} = React;';
if(!f.includes(old1)){console.error('X hooks import');process.exit(1)}
f=f.replace(old1,'const {\n  useState,\n  useEffect,\n  useCallback,\n  useRef,\n  useMemo\n} = React;');
c++;console.log('OK 1-import useMemo');

// 2. Add punch index builder (groups punches by employee once)
// Insert right before calcDayHours function
var old2='function calcDayHours(punches';
if(!f.includes(old2)){console.error('X calcDayHours');process.exit(1)}
f=f.replace(old2,
'var __punchIndex=null,__punchIndexKey="";\n'+
'function getPunchesByEid(allPunches){\n'+
'  var key=allPunches.length+"-"+(allPunches[0]?allPunches[0].id:"")+"-"+(allPunches[allPunches.length-1]?allPunches[allPunches.length-1].id:"");\n'+
'  if(__punchIndex&&__punchIndexKey===key)return __punchIndex;\n'+
'  var idx={};\n'+
'  for(var i=0;i<allPunches.length;i++){var eid=allPunches[i].eid;if(!idx[eid])idx[eid]=[];idx[eid].push(allPunches[i])}\n'+
'  __punchIndex=idx;__punchIndexKey=key;\n'+
'  return idx;\n'+
'}\n'+
'function calcDayHours(punches');
c++;console.log('OK 2-punch index');

// 3. Optimize getDayPunchesWithCarryOver to use the index
var old3='function getDayPunchesWithCarryOver(allPunches, eid, dayStart, dayEnd) {\n  var dp = allPunches.filter(function(p) {\n    if(p.eid!==eid)return false;';
if(!f.includes(old3)){
  // Try compact version
  old3='function getDayPunchesWithCarryOver(allPunches, eid, dayStart, dayEnd) {';
}
f=f.replace(old3,
'function getDayPunchesWithCarryOver(allPunches, eid, dayStart, dayEnd) {\n  allPunches = getPunchesByEid(allPunches)[eid] || [];');
c++;console.log('OK 3-indexed lookups');

// 4. Memoize statuses in ManagerView - wrap with useMemo
var old4='var statuses = active.map(function (e) {\n    var cs = getCurrentState(e, validPunches);\n    var wk = calcWeekHoursForWeek(validPunches, e.id, mon);\n    var excs = detectExceptions(e, validPunches, P);\n    var cost = calcLaborCostForWeek(e, validPunches, P, mon);\n    return Object.assign({}, e, {\n      cs: cs,\n      weekH: wk,\n      otFlag: wk >= P.otWeekly,\n      excs: excs,\n      cost: cost\n    });\n  });';
if(!f.includes(old4)){console.error('X statuses block');process.exit(1)}
f=f.replace(old4,
'var statuses = useMemo(function(){ return active.map(function (e) {\n    var cs = getCurrentState(e, validPunches);\n    var wk = calcWeekHoursForWeek(validPunches, e.id, mon);\n    var excs = detectExceptions(e, validPunches, P);\n    var cost = calcLaborCostForWeek(e, validPunches, P, mon);\n    return Object.assign({}, e, {\n      cs: cs,\n      weekH: wk,\n      otFlag: wk >= P.otWeekly,\n      excs: excs,\n      cost: cost\n    });\n  }); }, [emps, punches, weekOffset]);');
c++;console.log('OK 4-memoize statuses');

fs.writeFileSync(F,f,'utf8');
console.log('\nDONE: '+c+' changes');
