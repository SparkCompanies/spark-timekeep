const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let f=fs.readFileSync(F,'utf8'),c=0;

// 1. Punch index - groups punches by employee, cached until punches change
var old2='function calcDayHours(punches';
if(!f.includes(old2)){console.error('X calcDayHours');process.exit(1)}
f=f.replace(old2,
'var __pIdx=null,__pIdxKey="";\n'+
'function getPunchesByEid(allPunches){\n'+
'  var key=allPunches.length+"|"+(allPunches[0]?allPunches[0].id:"")+"|"+(allPunches[allPunches.length-1]?allPunches[allPunches.length-1].id:"");\n'+
'  if(__pIdx&&__pIdxKey===key)return __pIdx;\n'+
'  var idx={};\n'+
'  for(var i=0;i<allPunches.length;i++){var eid=allPunches[i].eid;if(!idx[eid])idx[eid]=[];idx[eid].push(allPunches[i])}\n'+
'  __pIdx=idx;__pIdxKey=key;\n'+
'  return idx;\n'+
'}\n'+
'function calcDayHours(punches');
c++;console.log('OK 1-punch index');

// 2. getDayPunchesWithCarryOver uses index (only scans that employee's punches)
var old3='function getDayPunchesWithCarryOver(allPunches, eid, dayStart, dayEnd) {';
if(!f.includes(old3)){console.error('X carryover fn');process.exit(1)}
f=f.replace(old3,
'function getDayPunchesWithCarryOver(allPunches, eid, dayStart, dayEnd) {\n  allPunches = getPunchesByEid(allPunches)[eid] || [];');
c++;console.log('OK 2-indexed carryover');

// 3. Plain-object cache for statuses (no React hooks - safe)
var old4='var statuses = active.map(function (e) {\n    var cs = getCurrentState(e, validPunches);';
if(!f.includes(old4)){console.error('X statuses');process.exit(1)}
f=f.replace(old4,
'var __stKey=active.length+"|"+validPunches.length+"|"+weekOffset+"|"+(validPunches[0]?validPunches[0].id:"");\n'+
'  if(!window.__stCache)window.__stCache={};\n'+
'  var statuses;\n'+
'  if(window.__stCache.key===__stKey){statuses=window.__stCache.val}\n'+
'  else{statuses = active.map(function (e) {\n    var cs = getCurrentState(e, validPunches);');
c++;console.log('OK 3a-cache check');

// Close the cache write after the map
var old5='      excs: excs,\n      cost: cost\n    });\n  });';
if(!f.includes(old5)){console.error('X statuses close');process.exit(1)}
f=f.replace(old5,
'      excs: excs,\n      cost: cost\n    });\n  });\n  window.__stCache={key:__stKey,val:statuses};}');
c++;console.log('OK 3b-cache write');

fs.writeFileSync(F,f,'utf8');
console.log('\nDONE: '+c+' changes');
