// patch-viewer-role.cjs
// Adds a read-only "Viewer" role to Spark TimeKeep.
// Run from ~/Documents/spark-timekeep with: node patch-viewer-role.cjs
//
// What this does:
//   - Adds "viewer" option to Staff Access role dropdown
//   - Routes viewer logins into ManagerView with readOnly=true
//   - Hides ALL action buttons + Approvals tab in viewer mode
//   - Filters Staff Access + Audit Log tabs hidden (admin only anyway)
//   - Shows gold "VIEW ONLY" badge in header
//   - Disables click-to-edit on punches

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html.length;
console.log(`Read ${before} chars`);

// Backup
fs.writeFileSync(file + '.bak-viewer', html);
console.log('Backup → index.html.bak-viewer');

let changes = 0;
function done(label) { changes++; console.log(`✅ ${label}`); }
function fail(label) { console.error(`❌ ${label}`); process.exit(1); }

// ───────────────────────────────────────────────────────────────
// PATCH 1: Add "Viewer" option to the Staff Access role dropdown
// ───────────────────────────────────────────────────────────────
const OLD_OPTS = `}, /*#__PURE__*/React.createElement("option", {
    value: "manager"
  }, "Manager"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Admin")))), /*#__PURE__*/React.createElement("div", {`;

const NEW_OPTS = `}, /*#__PURE__*/React.createElement("option", {
    value: "manager"
  }, "Manager"), /*#__PURE__*/React.createElement("option", {
    value: "viewer"
  }, "Viewer (Read-Only)"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Admin")))), /*#__PURE__*/React.createElement("div", {`;

if (html.includes('value: "viewer"')) {
  console.log('⚠️  P1 skip — viewer option already present');
} else if (html.includes(OLD_OPTS)) {
  html = html.replace(OLD_OPTS, NEW_OPTS);
  done('P1: Viewer option added to Staff Access dropdown');
} else {
  fail('P1: could not find role dropdown options');
}

// ───────────────────────────────────────────────────────────────
// PATCH 2: Color the VIEWER role tag in the staff list (gold)
// Existing: color: s.role === "admin" ? C.red : C.blue
// Change to: ternary that handles viewer
// ───────────────────────────────────────────────────────────────
const OLD_COLOR = 'color: s.role === "admin" ? C.red : C.blue';
const NEW_COLOR = 'color: s.role === "admin" ? C.red : s.role === "viewer" ? C.spark : C.blue';
if (html.includes(NEW_COLOR)) {
  console.log('⚠️  P2 skip — viewer color tag already present');
} else if (html.includes(OLD_COLOR)) {
  html = html.replace(OLD_COLOR, NEW_COLOR);
  done('P2: Viewer role tag colored gold in staff list');
} else {
  fail('P2: could not find role tag color line');
}

// ───────────────────────────────────────────────────────────────
// PATCH 3: Pass readOnly prop into ManagerView based on role
// Existing render block at the bottom of App:
//   view === "manager" && loggedIn && React.createElement(ManagerView, { ... staffName: ... })
// We inject readOnly: loggedIn.role === "viewer"
// ───────────────────────────────────────────────────────────────
const OLD_MV_RENDER = `    onLogout: handleLogout,
    staffName: loggedIn.fn + " " + loggedIn.ln
  }), view === "admin" && loggedIn`;

const NEW_MV_RENDER = `    onLogout: handleLogout,
    staffName: loggedIn.fn + " " + loggedIn.ln,
    readOnly: loggedIn.role === "viewer"
  }), view === "admin" && loggedIn`;

if (html.includes('readOnly: loggedIn.role === "viewer"')) {
  console.log('⚠️  P3 skip — readOnly prop already wired');
} else if (html.includes(OLD_MV_RENDER)) {
  html = html.replace(OLD_MV_RENDER, NEW_MV_RENDER);
  done('P3: readOnly prop passed into ManagerView');
} else {
  fail('P3: could not find ManagerView render block');
}

// ───────────────────────────────────────────────────────────────
// PATCH 4: Accept readOnly in ManagerView destructured params
// CRITICAL: this is where the previous manual edit broke things.
// We add it as the LAST prop inside the destructure, no trailing comma,
// so syntax stays valid no matter what.
// ───────────────────────────────────────────────────────────────
const OLD_MV_SIG = `  deletePunch,
  editPunch,
  onSwitchView
}) {`;

const NEW_MV_SIG = `  deletePunch,
  editPunch,
  onSwitchView,
  readOnly
}) {`;

if (html.includes('  readOnly\n}) {')) {
  console.log('⚠️  P4 skip — readOnly param already in signature');
} else if (html.includes(OLD_MV_SIG)) {
  html = html.replace(OLD_MV_SIG, NEW_MV_SIG);
  done('P4: readOnly accepted in ManagerView signature');
} else {
  fail('P4: could not find ManagerView signature');
}

// ───────────────────────────────────────────────────────────────
// PATCH 5: Filter Approvals tab out for viewers (read-only can see
// pending requests but not the approval action tab — keeping tab gives
// no value when buttons are hidden, so we just hide the tab entirely)
// Existing: var tabDef = [["dashboard", ...], ..., ["approvals", ...]];
// New: same but .filter at the end stripping approvals when readOnly
// ───────────────────────────────────────────────────────────────
const OLD_TABDEF_END = `["approvals", "Approvals" + (pending.length > 0 ? " (" + pending.length + ")" : "")]];`;
const NEW_TABDEF_END = `["approvals", "Approvals" + (pending.length > 0 ? " (" + pending.length + ")" : "")]].filter(function(t){return !(readOnly && t[0]==="approvals")});`;

if (html.includes('readOnly && t[0]==="approvals"')) {
  console.log('⚠️  P5 skip — approvals tab filter already present');
} else if (html.includes(OLD_TABDEF_END)) {
  html = html.replace(OLD_TABDEF_END, NEW_TABDEF_END);
  done('P5: Approvals tab hidden for viewers');
} else {
  fail('P5: could not find tabDef end');
}

// ───────────────────────────────────────────────────────────────
// PATCH 6: Hide "+ Add Punch" button (in Who's-In/Timesheets area)
// Wrap the React.createElement for + Add Punch in a !readOnly guard
// Anchor: "+ Add Punch" string is unique
// ───────────────────────────────────────────────────────────────
// Find the open of that button — walk backward from "+ Add Punch"
// The button starts with: /*#__PURE__*/React.createElement("button", {
//   onClick: function () {
//     setShowAddPunch(true);
//   },
//   ...
// }, "+ Add Punch")
//
// We wrap it: !readOnly && /*#__PURE__*/React.createElement("button", { ... }, "+ Add Punch")
//
// There are TWO add-punch buttons:
//   - "+ Add Punch"           (line ~3856, in Timesheets)
//   - "+ Manual Punch Correction" (line ~4767, in Alerts/Points area)
// Both need the guard.
//
// Strategy: replace each anchor with a sentinel-wrapped version using
// a regex that captures the React.createElement block.

// First, find and wrap "+ Add Punch"
{
  const marker = '}, "+ Add Punch")';
  const idx = html.indexOf(marker);
  if (idx === -1) fail('P6a: could not locate "+ Add Punch" marker');

  // Walk backward to find the matching React.createElement("button"
  const startMarker = '/*#__PURE__*/React.createElement("button", {\n    onClick: function () {\n      setShowAddPunch(true);\n    },';
  const startIdx = html.lastIndexOf(startMarker, idx);
  if (startIdx === -1) fail('P6a: could not locate Add Punch button start');

  // Check if already wrapped
  const before20 = html.substring(Math.max(0, startIdx - 20), startIdx);
  if (before20.includes('!readOnly &&')) {
    console.log('⚠️  P6a skip — Add Punch already wrapped');
  } else {
    // Insert "!readOnly && " before the React.createElement
    html = html.substring(0, startIdx) + '!readOnly && ' + html.substring(startIdx);
    done('P6a: + Add Punch wrapped with !readOnly');
  }
}

// Second, wrap "+ Manual Punch Correction"
{
  const marker = '}, "+ Manual Punch Correction")';
  const idx = html.indexOf(marker);
  if (idx === -1) fail('P6b: could not locate "+ Manual Punch Correction" marker');

  const startMarker = '/*#__PURE__*/React.createElement("button", {\n    onClick: function () {\n      setShowAddPunch(true);\n    },';
  const startIdx = html.lastIndexOf(startMarker, idx);
  if (startIdx === -1) fail('P6b: could not locate Manual Punch Correction button start');

  const before20 = html.substring(Math.max(0, startIdx - 20), startIdx);
  if (before20.includes('!readOnly &&')) {
    console.log('⚠️  P6b skip — Manual Punch Correction already wrapped');
  } else {
    html = html.substring(0, startIdx) + '!readOnly && ' + html.substring(startIdx);
    done('P6b: + Manual Punch Correction wrapped with !readOnly');
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 7: Hide "Edit Punches" toggle button
// Anchor: showPunchEditor?"Close Editor":"Edit Punches"
// ───────────────────────────────────────────────────────────────
{
  const OLD_EDIT_BTN = '/*#__PURE__*/React.createElement("button", {onClick:function(){setShowPunchEditor(!showPunchEditor)},style:{padding:"8px 16px",background:"transparent",border:"1px solid "+(C.spark||"#FACC15"),color:C.spark||"#FACC15",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,marginLeft:8}}, showPunchEditor?"Close Editor":"Edit Punches")';
  const NEW_EDIT_BTN = '!readOnly && /*#__PURE__*/React.createElement("button", {onClick:function(){setShowPunchEditor(!showPunchEditor)},style:{padding:"8px 16px",background:"transparent",border:"1px solid "+(C.spark||"#FACC15"),color:C.spark||"#FACC15",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,marginLeft:8}}, showPunchEditor?"Close Editor":"Edit Punches")';

  if (html.includes('!readOnly && /*#__PURE__*/React.createElement("button", {onClick:function(){setShowPunchEditor')) {
    console.log('⚠️  P7 skip — Edit Punches button already wrapped');
  } else if (html.includes(OLD_EDIT_BTN)) {
    html = html.replace(OLD_EDIT_BTN, NEW_EDIT_BTN);
    done('P7: Edit Punches toggle wrapped with !readOnly');
  } else {
    fail('P7: could not find Edit Punches button');
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 8: Hide Approve / Deny buttons on requests
// Approve button onClick: onApproveRequest(req.id)
// Deny button onClick: onDenyRequest(req.id)
// ───────────────────────────────────────────────────────────────
{
  const APPROVE_OLD = `}, /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        onApproveRequest(req.id);
      },`;
  const APPROVE_NEW = `}, !readOnly && /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        onApproveRequest(req.id);
      },`;
  if (html.includes('!readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function () {\n        onApproveRequest')) {
    console.log('⚠️  P8a skip — Approve button already wrapped');
  } else if (html.includes(APPROVE_OLD)) {
    html = html.replace(APPROVE_OLD, APPROVE_NEW);
    done('P8a: Approve button wrapped with !readOnly');
  } else {
    fail('P8a: could not find Approve button');
  }

  const DENY_OLD = `}, "Approve"), /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        onDenyRequest(req.id);
      },`;
  const DENY_NEW = `}, "Approve"), !readOnly && /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        onDenyRequest(req.id);
      },`;
  if (html.includes('!readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function () {\n        onDenyRequest')) {
    console.log('⚠️  P8b skip — Deny button already wrapped');
  } else if (html.includes(DENY_OLD)) {
    html = html.replace(DENY_OLD, DENY_NEW);
    done('P8b: Deny button wrapped with !readOnly');
  } else {
    fail('P8b: could not find Deny button');
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 9: Hide "↓ Called In" downgrade button on no-show events
// Anchor: "↓ Called In" string is unique
// ───────────────────────────────────────────────────────────────
{
  const OLD_DOWNGRADE = `ev.type === "no-show" && /*#__PURE__*/React.createElement("button", {onClick: function(){if(confirm("Downgrade this No-Show to Called In?`;
  const NEW_DOWNGRADE = `ev.type === "no-show" && !readOnly && /*#__PURE__*/React.createElement("button", {onClick: function(){if(confirm("Downgrade this No-Show to Called In?`;
  if (html.includes('ev.type === "no-show" && !readOnly &&')) {
    console.log('⚠️  P9 skip — Downgrade button already wrapped');
  } else if (html.includes(OLD_DOWNGRADE)) {
    html = html.replace(OLD_DOWNGRADE, NEW_DOWNGRADE);
    done('P9: Downgrade NCN→Called In button wrapped with !readOnly');
  } else {
    fail('P9: could not find Downgrade button');
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 10: Pass readOnly into TimesheetDrilldown so per-punch
// Edit buttons can be hidden inside it.
// Existing: React.createElement(TimesheetDrilldown,{emp:selEmp,..., onPunch:onPunch})
// We add readOnly:readOnly
// ───────────────────────────────────────────────────────────────
{
  const OLD_TS_CALL = 'React.createElement(TimesheetDrilldown,{emp:selEmp,punches:punches,mon:mon,weekOffset:weekOffset,setWeekOffset:setWeekOffset,setSelEmp:setSelEmp,setSelDay:setSelDay,selDay:selDay,onIssuePoint:onIssuePoint,setEditingPunch:setEditingPunch,deletePunch:deletePunch,editPunch:editPunch,policy:P,onPunch:onPunch})';
  const NEW_TS_CALL = 'React.createElement(TimesheetDrilldown,{emp:selEmp,punches:punches,mon:mon,weekOffset:weekOffset,setWeekOffset:setWeekOffset,setSelEmp:setSelEmp,setSelDay:setSelDay,selDay:selDay,onIssuePoint:onIssuePoint,setEditingPunch:setEditingPunch,deletePunch:deletePunch,editPunch:editPunch,policy:P,onPunch:onPunch,readOnly:readOnly})';
  if (html.includes('readOnly:readOnly})')) {
    console.log('⚠️  P10 skip — TimesheetDrilldown already gets readOnly');
  } else if (html.includes(OLD_TS_CALL)) {
    html = html.replace(OLD_TS_CALL, NEW_TS_CALL);
    done('P10: readOnly passed to TimesheetDrilldown');
  } else {
    fail('P10: could not find TimesheetDrilldown call');
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 11: Accept readOnly in TimesheetDrilldown signature
// ───────────────────────────────────────────────────────────────
{
  const OLD_TS_SIG = 'function TimesheetDrilldown({emp,punches,mon,weekOffset,setWeekOffset,setSelEmp,setSelDay,selDay,onIssuePoint,setEditingPunch,deletePunch,editPunch,policy,onPunch}) {';
  const NEW_TS_SIG = 'function TimesheetDrilldown({emp,punches,mon,weekOffset,setWeekOffset,setSelEmp,setSelDay,selDay,onIssuePoint,setEditingPunch,deletePunch,editPunch,policy,onPunch,readOnly}) {';
  if (html.includes(',readOnly}) {')) {
    console.log('⚠️  P11 skip — TimesheetDrilldown signature already has readOnly');
  } else if (html.includes(OLD_TS_SIG)) {
    html = html.replace(OLD_TS_SIG, NEW_TS_SIG);
    done('P11: readOnly accepted in TimesheetDrilldown signature');
  } else {
    fail('P11: could not find TimesheetDrilldown signature');
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 12: Hide Edit buttons inside TimesheetDrilldown (2 instances)
// Anchors are the two button defs on lines ~3314 and ~3333 with
// onClick:function(){setEditingPunch(Object.assign({},p,{eid:emp.id}))}
// ───────────────────────────────────────────────────────────────
{
  const OLD_EDIT_FRAG = 'React.createElement("button",{onClick:function(){setEditingPunch(Object.assign({},p,{eid:emp.id}))}';
  const NEW_EDIT_FRAG = '!readOnly && React.createElement("button",{onClick:function(){setEditingPunch(Object.assign({},p,{eid:emp.id}))}';

  // Replace all occurrences using split/join (safer than regex for special chars)
  const occurrences = html.split(OLD_EDIT_FRAG).length - 1;
  const alreadyWrapped = html.split(NEW_EDIT_FRAG).length - 1;

  if (alreadyWrapped >= 2) {
    console.log('⚠️  P12 skip — drilldown Edit buttons already wrapped');
  } else if (occurrences >= 2) {
    html = html.split(OLD_EDIT_FRAG).join(NEW_EDIT_FRAG);
    done(`P12: ${occurrences} drilldown Edit buttons wrapped with !readOnly`);
  } else {
    fail(`P12: expected ≥2 drilldown Edit buttons, found ${occurrences}`);
  }
}

// ───────────────────────────────────────────────────────────────
// PATCH 13: Show "VIEW ONLY" badge in Header for viewers
// Strategy: pass readOnly into Header in the ManagerView render,
// add the prop to Header signature, render badge next to staffName.
// ───────────────────────────────────────────────────────────────
{
  // 13a: pass readOnly to Header
  const OLD_HDR_CALL = `React.createElement(Header, {
    title: "Manager Dashboard",
    sub: "Monitoring " + active.length + " employees",
    onLogout: onLogout,
    staffName: staffName
  })`;
  const NEW_HDR_CALL = `React.createElement(Header, {
    title: "Manager Dashboard",
    sub: "Monitoring " + active.length + " employees",
    onLogout: onLogout,
    staffName: staffName,
    readOnly: readOnly
  })`;
  if (html.includes('staffName: staffName,\n    readOnly: readOnly\n  })')) {
    console.log('⚠️  P13a skip — Header already gets readOnly');
  } else if (html.includes(OLD_HDR_CALL)) {
    html = html.replace(OLD_HDR_CALL, NEW_HDR_CALL);
    done('P13a: readOnly passed to Header in ManagerView render');
  } else {
    fail('P13a: could not find Header render in ManagerView');
  }

  // 13b: accept readOnly in Header signature
  const OLD_HDR_SIG = `function Header({
  title,
  sub,
  onLogout,
  staffName,
  downgradeEvent,
  editPunch
}) {`;
  const NEW_HDR_SIG = `function Header({
  title,
  sub,
  onLogout,
  staffName,
  downgradeEvent,
  editPunch,
  readOnly
}) {`;
  if (html.includes('  editPunch,\n  readOnly\n}) {')) {
    console.log('⚠️  P13b skip — Header signature already has readOnly');
  } else if (html.includes(OLD_HDR_SIG)) {
    html = html.replace(OLD_HDR_SIG, NEW_HDR_SIG);
    done('P13b: readOnly accepted in Header signature');
  } else {
    fail('P13b: could not find Header signature');
  }

  // 13c: render VIEW ONLY badge next to staffName pill
  // Anchor: SparkLogo render right after staffName pill
  const OLD_LOGO_RENDER = `, staffName)), /*#__PURE__*/React.createElement(SparkLogo, {
    size: "sm"
  }),`;
  const NEW_LOGO_RENDER = `, staffName)), readOnly && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 10px",
      borderRadius: 6,
      background: (C.spark || "#FACC15") + "22",
      border: "1px solid " + (C.spark || "#FACC15"),
      fontSize: 11,
      fontWeight: 800,
      color: C.spark || "#FACC15",
      letterSpacing: 1.2
    }
  }, "VIEW ONLY"), /*#__PURE__*/React.createElement(SparkLogo, {
    size: "sm"
  }),`;
  if (html.includes('"VIEW ONLY"), /*#__PURE__*/React.createElement(SparkLogo')) {
    console.log('⚠️  P13c skip — VIEW ONLY badge already rendered');
  } else if (html.includes(OLD_LOGO_RENDER)) {
    html = html.replace(OLD_LOGO_RENDER, NEW_LOGO_RENDER);
    done('P13c: VIEW ONLY badge added next to staff name');
  } else {
    fail('P13c: could not find SparkLogo anchor in Header');
  }
}

// ───────────────────────────────────────────────────────────────
// VERIFICATION
// ───────────────────────────────────────────────────────────────
console.log('\n── Verification ──────────────────────────');

const checks = [
  ['Viewer option in dropdown', 'value: "viewer"'],
  ['Viewer color in tag', 's.role === "viewer" ? C.spark'],
  ['readOnly passed to MV', 'readOnly: loggedIn.role === "viewer"'],
  ['readOnly in MV signature', '  onSwitchView,\n  readOnly\n}) {'],
  ['Approvals tab filter', 'readOnly && t[0]==="approvals"'],
  ['Add Punch wrapped', '!readOnly && /*#__PURE__*/React.createElement("button", {\n    onClick: function () {\n      setShowAddPunch(true);'],
  ['Edit Punches toggle wrapped', '!readOnly && /*#__PURE__*/React.createElement("button", {onClick:function(){setShowPunchEditor'],
  ['Approve wrapped', '!readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function () {\n        onApproveRequest'],
  ['Deny wrapped', '!readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function () {\n        onDenyRequest'],
  ['Downgrade wrapped', 'ev.type === "no-show" && !readOnly &&'],
  ['readOnly in TS signature', ',readOnly}) {'],
  ['readOnly passed to TS', 'readOnly:readOnly})'],
  ['Drilldown Edit wrapped', '!readOnly && React.createElement("button",{onClick:function(){setEditingPunch'],
  ['Header gets readOnly', 'staffName: staffName,\n    readOnly: readOnly'],
  ['Header sig has readOnly', '  editPunch,\n  readOnly\n}) {'],
  ['VIEW ONLY badge rendered', '"VIEW ONLY"), /*#__PURE__*/React.createElement(SparkLogo'],
];

let pass = 0, miss = 0;
checks.forEach(function(c){
  const ok = html.includes(c[1]);
  console.log((ok ? '✅' : '❌') + ' ' + c[0]);
  ok ? pass++ : miss++;
});

const after = html.length;
console.log('\nFile: ' + before + ' → ' + after + ' (' + (after - before >= 0 ? '+' : '') + (after - before) + ' chars)');
console.log('Changes applied: ' + changes);
console.log('Checks passing: ' + pass + '/' + checks.length);

if (miss > 0) {
  console.error('\n❌ Some checks failed. NOT writing file. Restore-safe.');
  process.exit(1);
}

fs.writeFileSync(file, html);
console.log('\n✨ Patch applied. Push when ready:');
console.log('  git add index.html');
console.log('  git commit -m "feat: read-only viewer role"');
console.log('  git push');
