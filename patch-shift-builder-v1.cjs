#!/usr/bin/env node
/**
 * PATCH: Shift Builder & Template Library for Spark TimeKeep
 * Adds DFM shift templates, schedule patterns, and rebuilt Schedules tab
 * Usage: node patch-shift-builder.cjs
 */
const fs=require('fs'),path=require('path'),F=path.join(__dirname,'index.html');
let L=fs.readFileSync(F,'utf8').split('\n'),c=0;
function fi(s,f){for(let i=f||0;i<L.length;i++)if(L[i].includes(s))return i;return -1}
function ok(l){c++;console.log('OK '+l)}
function no(l){console.error('X MISSING: '+l);process.exit(1)}

// ═══════════════════════════════════════════════
// 1. Replace const SHIFTS with DEFAULT_SHIFT_TEMPLATES
// ═══════════════════════════════════════════════
let shiftStart=fi('const SHIFTS = [{');
let shiftEnd=fi('}];',shiftStart);
if(shiftStart<0||shiftEnd<0)no('SHIFTS constant');
// Remove old SHIFTS lines
L.splice(shiftStart,shiftEnd-shiftStart+1,
`const SHIFTS_LEGACY=[{k:"day",l:"Day Shift",start:"06:00",end:"14:30"},{k:"night",l:"Night Shift",start:"22:00",end:"06:30"}];`,
`const DEFAULT_SHIFT_TEMPLATES=[`,
`{id:"ST01",name:"Midnight Standard",dept:"Maintenance",start:"22:30",end:"07:00",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#A855F7"},`,
`{id:"ST02",name:"Midnight Shift A (Sun-Thu)",dept:"Maintenance",start:"22:30",end:"07:00",hrs:8,pattern:"Shift A",workDays:[0,2,3,4,5],color:"#8B5CF6"},`,
`{id:"ST03",name:"Midnight Shift B (Tue-Sat)",dept:"Maintenance",start:"22:30",end:"07:00",hrs:8,pattern:"Shift B",workDays:[2,3,4,5,6],color:"#7C3AED"},`,
`{id:"ST04",name:"Days Standard",dept:"Maintenance",start:"06:30",end:"15:00",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"},`,
`{id:"ST05",name:"Days Shift A (Sun-Thu)",dept:"Maintenance",start:"06:30",end:"15:00",hrs:8,pattern:"Shift A",workDays:[0,2,3,4,5],color:"#EAB308"},`,
`{id:"ST06",name:"Days Shift B (Tue-Sat)",dept:"Maintenance",start:"06:30",end:"15:00",hrs:8,pattern:"Shift B",workDays:[2,3,4,5,6],color:"#CA8A04"},`,
`{id:"ST07",name:"Afternoons Standard",dept:"Maintenance",start:"14:30",end:"23:00",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FB923C"},`,
`{id:"ST08",name:"Afternoons Shift A (Sun-Thu)",dept:"Maintenance",start:"14:30",end:"23:00",hrs:8,pattern:"Shift A",workDays:[0,2,3,4,5],color:"#F97316"},`,
`{id:"ST09",name:"Afternoons Shift B (Tue-Sat)",dept:"Maintenance",start:"14:30",end:"23:00",hrs:8,pattern:"Shift B",workDays:[2,3,4,5,6],color:"#EA580C"},`,
`{id:"ST10",name:"Midnight Standard",dept:"Janitorial",start:"22:00",end:"06:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#A855F7"},`,
`{id:"ST11",name:"Midnight 12hr Shift A",dept:"Janitorial",start:"18:00",end:"06:00",hrs:12,pattern:"2-2-3 A",workDays:[0,3,4,5,6],color:"#8B5CF6"},`,
`{id:"ST12",name:"Midnight 12hr Shift B",dept:"Janitorial",start:"18:00",end:"06:00",hrs:12,pattern:"2-2-3 B",workDays:[1,2],color:"#7C3AED"},`,
`{id:"ST13",name:"Days Standard",dept:"Janitorial",start:"06:00",end:"14:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"},`,
`{id:"ST14",name:"Afternoons Standard",dept:"Janitorial",start:"14:00",end:"22:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FB923C"},`,
`{id:"ST15",name:"Days 12hr Shift A",dept:"Janitorial",start:"06:00",end:"18:00",hrs:12,pattern:"2-2-3 A",workDays:[0,3,4,5,6],color:"#EAB308"},`,
`{id:"ST16",name:"Days 12hr Shift B",dept:"Janitorial",start:"06:00",end:"18:00",hrs:12,pattern:"2-2-3 B",workDays:[1,2],color:"#CA8A04"},`,
`{id:"ST17",name:"Midnight 12hr Shift A",dept:"Technical Cleaning",start:"18:00",end:"06:00",hrs:12,pattern:"2-2-3 A",workDays:[0,3,4,5,6],color:"#8B5CF6"},`,
`{id:"ST18",name:"Midnight 12hr Shift B",dept:"Technical Cleaning",start:"18:00",end:"06:00",hrs:12,pattern:"2-2-3 B",workDays:[1,2],color:"#7C3AED"},`,
`{id:"ST19",name:"Days Standard",dept:"Technical Cleaning",start:"06:00",end:"14:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"},`,
`{id:"ST20",name:"Days 12hr Shift A",dept:"Technical Cleaning",start:"06:00",end:"18:00",hrs:12,pattern:"2-2-3 A",workDays:[0,3,4,5,6],color:"#EAB308"},`,
`{id:"ST21",name:"Days 12hr Shift B",dept:"Technical Cleaning",start:"06:00",end:"18:00",hrs:12,pattern:"2-2-3 B",workDays:[1,2],color:"#CA8A04"},`,
`{id:"ST22",name:"Weekday Sup AM",dept:"Supervision",start:"07:00",end:"15:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#22C55E"},`,
`{id:"ST23",name:"Weekday Sup PM",dept:"Supervision",start:"15:00",end:"23:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#22C55E"},`,
`{id:"ST24",name:"Weekday Sup Mid",dept:"Supervision",start:"11:00",end:"19:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#22C55E"},`,
`{id:"ST25",name:"Weekend Sup Day",dept:"Supervision",start:"05:00",end:"17:00",hrs:12,pattern:"Wknd+Fri",workDays:[0,5,6],color:"#3B82F6"},`,
`{id:"ST26",name:"Weekend Sup Night",dept:"Supervision",start:"17:00",end:"05:00",hrs:12,pattern:"Wknd+Fri",workDays:[0,5,6],color:"#3B82F6"},`,
`{id:"ST27",name:"BMS Control Room 7-Day",dept:"Supervision",start:"07:00",end:"15:00",hrs:8,pattern:"7-Day",workDays:[0,1,2,3,4,5,6],color:"#EF4444"},`,
`{id:"ST28",name:"Days Standard",dept:"Pack Plant",start:"06:00",end:"14:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"},`,
`{id:"ST29",name:"Afternoons Standard",dept:"Pack Plant",start:"14:00",end:"22:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FB923C"},`,
`{id:"ST30",name:"Days Standard",dept:"Engineers",start:"06:00",end:"14:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"}`,
`];`,
`var SHIFTS=DEFAULT_SHIFT_TEMPLATES.map(function(t){return{k:t.id,l:t.name,start:t.start,end:t.end}});`
);
ok('1-replace SHIFTS with templates (30 DFM shifts)');

// ═══════════════════════════════════════════════
// 2. Add shift templates state to App
// ═══════════════════════════════════════════════
let appPolicy=fi('useState(DEFAULT_POLICY)');
if(appPolicy<0)no('policy state');
let afterPolicy=fi(';',appPolicy);
L.splice(afterPolicy+1,0,
'  var rTemplates=useState(DEFAULT_SHIFT_TEMPLATES),shiftTemplates=rTemplates[0],setShiftTemplates=rTemplates[1];'
);
ok('2-shift templates state');

// ═══════════════════════════════════════════════
// 3. Pass shiftTemplates to AdminView
// ═══════════════════════════════════════════════
let adminViewRender=fi('React.createElement(AdminView,');
if(adminViewRender<0)adminViewRender=fi('React.createElement(AdminView, {');
if(adminViewRender<0)no('AdminView render');
let adminStaffLine=fi('staff: staff',adminViewRender);
if(adminStaffLine<0)no('staff prop in AdminView');
L[adminStaffLine]=L[adminStaffLine].replace('staff: staff','staff: staff,\n    shiftTemplates: shiftTemplates,\n    onUpdateTemplates: function(nt){setShiftTemplates(nt);sSet("tk-v7-shifts",nt);if(useSupa())sbSaveConfig("shifts",nt)}');
ok('3-pass templates to AdminView');

// ═══════════════════════════════════════════════
// 4. Add shiftTemplates to AdminView props
// ═══════════════════════════════════════════════
let adminFn=fi('function AdminView({');
let adminOnSwitchView=fi('onSwitchView',adminFn);
// Find the closing brace of the destructure
let adminClose=fi('}) {',adminOnSwitchView);
if(adminClose<0)no('AdminView close brace');
L[adminClose]=L[adminClose].replace('}) {','  shiftTemplates,\n  onUpdateTemplates\n}) {');
ok('4-AdminView props');

// ═══════════════════════════════════════════════
// 5. Add template state inside AdminView
// ═══════════════════════════════════════════════
let adminTab=fi("useState(\"employees\")",adminFn);
if(adminTab<0)no('admin tab state');
let adminTabEnd=fi(';',adminTab);
L.splice(adminTabEnd+1,0,
'  var rST=useState(shiftTemplates||DEFAULT_SHIFT_TEMPLATES),localTemplates=rST[0],setLocalTemplates=rST[1];',
'  var rShowNewShift=useState(false),showNewShift=rShowNewShift[0],setShowNewShift=rShowNewShift[1];',
'  var rNewShift=useState({name:"",dept:"",start:"06:00",end:"14:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"}),newShift=rNewShift[0],setNewShift=rNewShift[1];',
'  var rEditShift=useState(null),editShift=rEditShift[0],setEditShift=rEditShift[1];',
'  var rShiftDeptFilter=useState("all"),shiftDeptFilter=rShiftDeptFilter[0],setShiftDeptFilter=rShiftDeptFilter[1];',
'  function addShiftTemplate(){if(!newShift.name)return;var ns=localTemplates.concat([Object.assign({},newShift,{id:"ST-"+Date.now().toString(36)})]);setLocalTemplates(ns);if(onUpdateTemplates)onUpdateTemplates(ns);setNewShift({name:"",dept:"",start:"06:00",end:"14:30",hrs:8,pattern:"Mon-Fri",workDays:[1,2,3,4,5],color:"#FACC15"});setShowNewShift(false);logAdminAction("ADD_SHIFT",newShift.name,staffName)}',
'  function deleteShiftTemplate(id){var ns=localTemplates.filter(function(t){return t.id!==id});setLocalTemplates(ns);if(onUpdateTemplates)onUpdateTemplates(ns);logAdminAction("DEL_SHIFT","ID:"+id,staffName)}',
'  function saveEditShift(){if(!editShift)return;var ns=localTemplates.map(function(t){return t.id===editShift.id?editShift:t});setLocalTemplates(ns);if(onUpdateTemplates)onUpdateTemplates(ns);logAdminAction("EDIT_SHIFT",editShift.name,staffName);setEditShift(null)}',
'  function assignTemplate(eid,tmplId){var tmpl=localTemplates.find(function(t){return t.id===tmplId});if(!tmpl)return;onUpdateEmps(emps.map(function(x){return x.id===eid?Object.assign({},x,{shiftStart:tmpl.start,shiftEnd:tmpl.end,workDays:tmpl.workDays.slice(),shift:tmpl.id,shiftTemplateName:tmpl.name}):x}),eid);logAdminAction("ASSIGN_SHIFT",tmpl.name+" -> "+(emps.find(function(e){return e.id===eid})||{fn:"?"}).fn,staffName)}'
);
ok('5-template state in AdminView');

// ═══════════════════════════════════════════════
// 6. Load shifts from Supabase/storage on startup
// ═══════════════════════════════════════════════
let loadPol=fi('var sbPol = await sbLoadConfig("policy")');
if(loadPol<0)loadPol=fi('sbLoadConfig("policy")');
if(loadPol<0)no('sbLoadConfig policy');
L.splice(loadPol+1,0,'          var sbShifts = await sbLoadConfig("shifts");');
let setPol=fi('if (sbPol) setPolicy(sbPol)',loadPol);
if(setPol<0)no('setPolicy');
L.splice(setPol+1,0,'          if (sbShifts && sbShifts.length>0) setShiftTemplates(sbShifts);');

// Also load from localStorage fallback
let lsPol=fi('var pol = await sGet("tk-v7-policy")',loadPol+5);
if(lsPol>=0){
  L.splice(lsPol+1,0,'          var shifts = await sGet("tk-v7-shifts");');
  let lsSetPol=fi('if (pol) setPolicy(pol)',lsPol);
  if(lsSetPol>=0)L.splice(lsSetPol+1,0,'          if (shifts && shifts.length>0) setShiftTemplates(shifts);');
}
ok('6-load templates on startup');

// ═══════════════════════════════════════════════
// 7. Replace Schedules tab UI entirely
// ═══════════════════════════════════════════════
let schedStart=fi('tab === "schedules" &&');
let schedEnd=fi('tab === "policy" &&',schedStart+1);
if(schedStart<0||schedEnd<0)no('schedules tab boundaries');

// Find exact cut points - schedStart line has both end-of-staff and start-of-schedules
// We need to keep everything before 'tab === "schedules"' on that line
let schedLine=L[schedStart];
let cutIdx=schedLine.indexOf('tab === "schedules"');
let beforeSched=schedLine.substring(0,cutIdx);

// schedEnd line has both end-of-schedules and start-of-policy
let policyLine=L[schedEnd];
let polCutIdx=policyLine.indexOf('tab === "policy"');
let afterSched=policyLine.substring(polCutIdx);

// Build new Schedules tab
let newSchedTab=`
tab === "schedules" && React.createElement("div",null,
  // ── HEADER ──
  React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
    React.createElement("div",null,
      React.createElement("div",{style:{fontSize:20,fontWeight:800,color:C.t1}},"Shift Builder"),
      React.createElement("div",{style:{fontSize:13,color:C.t3,marginTop:2}},"Create shift templates and assign to employees. "+localTemplates.length+" templates loaded.")
    ),
    React.createElement("div",{style:{display:"flex",gap:8}},
      React.createElement("select",{value:shiftDeptFilter,onChange:function(ev){setShiftDeptFilter(ev.target.value)},style:{padding:"8px 12px",background:C.bg,border:"1px solid "+C.bd,color:C.t1,borderRadius:6,fontSize:13,outline:"none",fontFamily:"inherit",appearance:"auto"}},
        React.createElement("option",{value:"all"},"All Departments"),
        localTemplates.map(function(t){return t.dept}).filter(function(v,i,a){return v&&a.indexOf(v)===i}).sort().map(function(d){return React.createElement("option",{key:d,value:d},d)})
      ),
      React.createElement("button",{onClick:function(){setShowNewShift(!showNewShift)},style:{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,color:C.bg,background:C.spark}},showNewShift?"Cancel":"+ New Template")
    )
  ),
  // ── NEW TEMPLATE FORM ──
  showNewShift&&React.createElement("div",{style:{background:C.sf,border:"2px solid "+C.spark+"44",borderRadius:12,padding:20,marginBottom:16}},
    React.createElement("div",{style:{fontSize:15,fontWeight:700,color:C.spark,marginBottom:14}},"Create Shift Template"),
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:mo?"1fr 1fr":"1fr 1fr 1fr 1fr 1fr",gap:10,marginBottom:12}},
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Template Name"),React.createElement("input",{value:newShift.name,onChange:function(ev){setNewShift(Object.assign({},newShift,{name:ev.target.value}))},placeholder:"e.g. Midnight Shift A",style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.t1,padding:"8px",borderRadius:6,fontSize:13,outline:"none"}})),
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Department"),React.createElement("input",{value:newShift.dept,onChange:function(ev){setNewShift(Object.assign({},newShift,{dept:ev.target.value}))},placeholder:"e.g. Maintenance",style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.t1,padding:"8px",borderRadius:6,fontSize:13,outline:"none"}})),
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Start Time"),React.createElement("input",{type:"time",value:newShift.start,onChange:function(ev){setNewShift(Object.assign({},newShift,{start:ev.target.value}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px",borderRadius:6,fontSize:13,fontFamily:Fm,outline:"none"}})),
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"End Time"),React.createElement("input",{type:"time",value:newShift.end,onChange:function(ev){setNewShift(Object.assign({},newShift,{end:ev.target.value}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px",borderRadius:6,fontSize:13,fontFamily:Fm,outline:"none"}})),
      React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Hours"),React.createElement("input",{type:"number",value:newShift.hrs,onChange:function(ev){setNewShift(Object.assign({},newShift,{hrs:parseFloat(ev.target.value)||8}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px",borderRadius:6,fontSize:13,fontFamily:Fm,outline:"none"}}))
    ),
    React.createElement("div",{style:{marginBottom:12}},
      React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:6}},"Work Days"),
      React.createElement("div",{style:{display:"flex",gap:4}},
        [{d:0,l:"Sun"},{d:1,l:"Mon"},{d:2,l:"Tue"},{d:3,l:"Wed"},{d:4,l:"Thu"},{d:5,l:"Fri"},{d:6,l:"Sat"}].map(function(x){
          var on=newShift.workDays.includes(x.d);
          return React.createElement("button",{key:x.d,onClick:function(){var nw=on?newShift.workDays.filter(function(v){return v!==x.d}):newShift.workDays.concat([x.d]);setNewShift(Object.assign({},newShift,{workDays:nw}))},style:{padding:"8px 12px",borderRadius:6,fontSize:13,fontWeight:700,color:on?C.bg:C.t4,background:on?C.spark:"transparent",border:"1px solid "+(on?C.spark:C.bd)}},x.l)
        })
      ),
      React.createElement("div",{style:{display:"flex",gap:6,marginTop:8}},
        [["Mon-Fri",[1,2,3,4,5]],["Shift A (Sun,Tue-Sat)",[0,2,3,4,5,6]],["Shift B (Tue-Sat)",[2,3,4,5,6]],["2-2-3 A (Sun,Wed-Sat)",[0,3,4,5,6]],["2-2-3 B (Mon-Tue)",[1,2]],["7-Day",[0,1,2,3,4,5,6]]].map(function(p){
          return React.createElement("button",{key:p[0],onClick:function(){setNewShift(Object.assign({},newShift,{workDays:p[1],pattern:p[0].split(" ")[0]}))},style:{padding:"4px 10px",borderRadius:5,fontSize:11,fontWeight:600,color:C.t3,background:C.bg,border:"1px solid "+C.bd,cursor:"pointer"}},p[0])
        })
      )
    ),
    React.createElement("div",{style:{display:"flex",gap:8}},
      React.createElement("button",{onClick:addShiftTemplate,disabled:!newShift.name,style:{padding:"10px 24px",borderRadius:8,fontSize:13,fontWeight:700,color:C.bg,background:newShift.name?C.green:C.t4}},"Create Template"),
      React.createElement("button",{onClick:function(){setShowNewShift(false)},style:{padding:"10px 16px",borderRadius:8,fontSize:13,fontWeight:600,color:C.t3,background:C.bg,border:"1px solid "+C.bd}},"Cancel")
    )
  ),
  // ── EDIT TEMPLATE MODAL ──
  editShift&&React.createElement("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16},onClick:function(){setEditShift(null)}},
    React.createElement("div",{onClick:function(ev){ev.stopPropagation()},style:{background:C.sf,border:"1px solid "+C.bd,borderRadius:16,padding:24,width:520,maxWidth:"100%"}},
      React.createElement("div",{style:{fontSize:16,fontWeight:700,color:C.t1,marginBottom:16}},"Edit Shift Template"),
      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}},
        React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Name"),React.createElement("input",{value:editShift.name,onChange:function(ev){setEditShift(Object.assign({},editShift,{name:ev.target.value}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.t1,padding:"8px",borderRadius:6,fontSize:13,outline:"none"}})),
        React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Department"),React.createElement("input",{value:editShift.dept,onChange:function(ev){setEditShift(Object.assign({},editShift,{dept:ev.target.value}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.t1,padding:"8px",borderRadius:6,fontSize:13,outline:"none"}})),
        React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Start"),React.createElement("input",{type:"time",value:editShift.start,onChange:function(ev){setEditShift(Object.assign({},editShift,{start:ev.target.value}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px",borderRadius:6,fontSize:13,fontFamily:Fm,outline:"none"}})),
        React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"End"),React.createElement("input",{type:"time",value:editShift.end,onChange:function(ev){setEditShift(Object.assign({},editShift,{end:ev.target.value}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px",borderRadius:6,fontSize:13,fontFamily:Fm,outline:"none"}})),
        React.createElement("div",null,React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Hours"),React.createElement("input",{type:"number",value:editShift.hrs,onChange:function(ev){setEditShift(Object.assign({},editShift,{hrs:parseFloat(ev.target.value)||8}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.bd,color:C.spark,padding:"8px",borderRadius:6,fontSize:13,fontFamily:Fm,outline:"none"}}))
      ),
      React.createElement("div",{style:{marginBottom:14}},
        React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:6}},"Work Days"),
        React.createElement("div",{style:{display:"flex",gap:4}},
          [{d:0,l:"Sun"},{d:1,l:"Mon"},{d:2,l:"Tue"},{d:3,l:"Wed"},{d:4,l:"Thu"},{d:5,l:"Fri"},{d:6,l:"Sat"}].map(function(x){
            var on=(editShift.workDays||[]).includes(x.d);
            return React.createElement("button",{key:x.d,onClick:function(){var nw=on?editShift.workDays.filter(function(v){return v!==x.d}):editShift.workDays.concat([x.d]);setEditShift(Object.assign({},editShift,{workDays:nw}))},style:{padding:"8px 12px",borderRadius:6,fontSize:13,fontWeight:700,color:on?C.bg:C.t4,background:on?C.spark:"transparent",border:"1px solid "+(on?C.spark:C.bd)}},x.l)
          })
        )
      ),
      React.createElement("div",{style:{display:"flex",gap:8}},
        React.createElement("button",{onClick:function(){setEditShift(null)},style:{flex:1,padding:"10px",borderRadius:8,fontSize:13,fontWeight:600,color:C.t3,background:C.bg,border:"1px solid "+C.bd}},"Cancel"),
        React.createElement("button",{onClick:saveEditShift,style:{flex:1,padding:"10px",borderRadius:8,fontSize:13,fontWeight:700,color:C.bg,background:C.spark}},"Save Changes")
      )
    )
  ),
  // ── TEMPLATE CARDS ──
  React.createElement("div",{style:{display:"grid",gridTemplateColumns:mo?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:20}},
    localTemplates.filter(function(t){return shiftDeptFilter==="all"||t.dept===shiftDeptFilter}).map(function(t){
      var assigned=emps.filter(function(e){return e.st==="active"&&e.shiftStart===t.start&&e.shiftEnd===t.end&&JSON.stringify((e.workDays||[]).sort())===JSON.stringify((t.workDays||[]).sort())});
      var dayLabels=["Su","Mo","Tu","We","Th","Fr","Sa"];
      return React.createElement("div",{key:t.id,style:{background:C.sf,border:"1px solid "+C.bd,borderRadius:10,padding:14,borderLeft:"4px solid "+(t.color||C.spark),position:"relative"}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}},
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:14,fontWeight:700,color:C.t1}},t.name),
            React.createElement("div",{style:{fontSize:12,color:C.t3,marginTop:2}},t.dept||"General")
          ),
          React.createElement("div",{style:{display:"flex",gap:4}},
            React.createElement("button",{onClick:function(){setEditShift(Object.assign({},t))},style:{padding:"3px 8px",fontSize:11,color:C.spark,background:"transparent",border:"1px solid "+C.spark+"44",borderRadius:4,cursor:"pointer",fontWeight:600}},"Edit"),
            React.createElement("button",{onClick:function(){if(confirm("Delete template: "+t.name+"?"))deleteShiftTemplate(t.id)},style:{padding:"3px 8px",fontSize:11,color:C.red,background:"transparent",border:"1px solid "+C.red+"44",borderRadius:4,cursor:"pointer",fontWeight:600}},"Del")
          )
        ),
        React.createElement("div",{style:{fontFamily:Fm,fontSize:15,fontWeight:700,color:t.color||C.spark,marginBottom:6}},t.start," \\u2013 ",t.end,React.createElement("span",{style:{fontSize:12,fontWeight:400,color:C.t4,marginLeft:6}},t.hrs+"hr")),
        React.createElement("div",{style:{display:"flex",gap:3,marginBottom:8}},
          [0,1,2,3,4,5,6].map(function(d){
            var on=(t.workDays||[]).includes(d);
            return React.createElement("div",{key:d,style:{width:24,height:24,borderRadius:4,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:on?C.bg:C.t4,background:on?(t.color||C.spark)+"CC":"transparent",border:"1px solid "+(on?(t.color||C.spark)+"44":C.bd)}},dayLabels[d])
          })
        ),
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
          React.createElement("div",{style:{fontSize:12,color:C.t3}},t.pattern||"Custom"),
          React.createElement("div",{style:{fontSize:13,fontWeight:700,color:assigned.length>0?C.green:C.t4}},assigned.length," assigned")
        )
      )
    })
  ),
  // ── EMPLOYEE ASSIGNMENT TABLE ──
  React.createElement("div",{style:{background:C.sf,border:"1px solid "+C.bd,borderRadius:12,padding:16}},
    React.createElement("div",{style:{fontSize:15,fontWeight:700,color:C.t1,marginBottom:12}},"Quick Assign"),
    React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:10}},"Select a shift template from the dropdown to assign it to an employee. This updates their start/end times and work days automatically."),
    React.createElement("div",{style:{maxHeight:400,overflowY:"auto"}},
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse"}},
        React.createElement("thead",null,React.createElement("tr",null,
          ["Employee","Dept","Current Shift","Template",""].map(function(h){return React.createElement("th",{key:h,style:{padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:C.t4,textTransform:"uppercase",borderBottom:"1px solid "+C.bd}},h)})
        )),
        React.createElement("tbody",null,
          emps.filter(function(e){return e.st==="active"}).sort(function(a,b){return(a.ln||"").localeCompare(b.ln||"")}).filter(function(e){return shiftDeptFilter==="all"||e.dept===shiftDeptFilter}).map(function(e){
            var curTmpl=localTemplates.find(function(t){return t.start===e.shiftStart&&t.end===e.shiftEnd&&JSON.stringify((t.workDays||[]).sort())===JSON.stringify(((e.workDays||[1,2,3,4,5])).sort())});
            return React.createElement("tr",{key:e.id,style:{borderBottom:"1px solid "+C.bd+"22"}},
              React.createElement("td",{style:{padding:"8px 10px"}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},React.createElement(Av,{fn:e.fn,ln:e.ln,sz:24}),React.createElement("span",{style:{fontSize:13,fontWeight:600,color:C.t1}},e.fn," ",e.ln))),
              React.createElement("td",{style:{padding:"8px 10px",fontSize:13,color:C.t3}},e.dept||"-"),
              React.createElement("td",{style:{padding:"8px 10px",fontFamily:Fm,fontSize:12,color:curTmpl?C.spark:C.t4}},curTmpl?curTmpl.name:(e.shiftStart||"?")+"\\u2013"+(e.shiftEnd||"?")),
              React.createElement("td",{style:{padding:"8px 10px"}},
                React.createElement("select",{value:curTmpl?curTmpl.id:"",onChange:function(ev){if(ev.target.value)assignTemplate(e.id,ev.target.value)},style:{padding:"6px 8px",background:C.bg,border:"1px solid "+C.bd,color:C.t1,borderRadius:6,fontSize:12,outline:"none",fontFamily:"inherit",appearance:"auto",maxWidth:220}},
                  React.createElement("option",{value:""},"Select template..."),
                  localTemplates.map(function(t){return React.createElement("option",{key:t.id,value:t.id},(t.dept?t.dept+" \\u2013 ":"")+t.name+" ("+t.start+"\\u2013"+t.end+")")})
                )
              ),
              React.createElement("td",{style:{padding:"8px 10px",textAlign:"center"}},curTmpl&&React.createElement("div",{style:{width:8,height:8,borderRadius:4,background:curTmpl.color||C.spark}}))
            )
          })
        )
      )
    )
  )
), `;

// Remove old schedules section and insert new
L.splice(schedStart, schedEnd-schedStart, beforeSched + newSchedTab.replace(/\n/g,' ') + afterSched);
ok('7-replace Schedules tab with Shift Builder');

// ═══════════════════════════════════════════════
// 8. Add template dropdown to employee edit modal
// ═══════════════════════════════════════════════
let editShiftStartUI=fi('"Shift Start"');
if(editShiftStartUI>=0){
  L.splice(editShiftStartUI-1,0,
    '  React.createElement("div",{style:{gridColumn:"1/-1",marginBottom:4}},React.createElement("div",{style:{fontSize:12,color:C.t4,marginBottom:4}},"Shift Template (auto-fills times & days)"),React.createElement("select",{value:"",onChange:function(ev){var t=(shiftTemplates||DEFAULT_SHIFT_TEMPLATES).find(function(x){return x.id===ev.target.value});if(t)setEditForm(Object.assign({},editForm,{shiftStart:t.start,shiftEnd:t.end}))},style:{width:"100%",background:C.bg,border:"1px solid "+C.spark+"44",color:C.t1,padding:"8px 10px",borderRadius:6,fontSize:13,outline:"none",appearance:"auto"}},React.createElement("option",{value:""},"Manual (keep current)"),'
    +'(shiftTemplates||DEFAULT_SHIFT_TEMPLATES).map(function(t){return React.createElement("option",{key:t.id,value:t.id},(t.dept?t.dept+" - ":"")+t.name+" ("+t.start+"\\u2013"+t.end+")")}))),'
  );
  ok('8-template dropdown in edit modal');
}

// ═══════════════════════════════════════════════
// DONE
// ═══════════════════════════════════════════════
fs.writeFileSync(F,L.join('\n'),'utf8');
console.log('\nDONE: '+c+' changes applied');
console.log('\nTo deploy:');
console.log('  git add -A && git commit -m "Add Shift Builder with DFM templates" && git push');
console.log('\nOptional Supabase: shifts persist via tk_config table (key: "shifts")');
console.log('No new table needed - uses existing config storage.');
