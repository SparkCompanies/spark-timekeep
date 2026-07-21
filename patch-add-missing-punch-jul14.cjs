#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   SPARK TIMEKEEP — Add Missing Punches — Jul 14, 2026
   1. AddPunchModal gains optional `prefill` {eid, type, date}:
      employee + punch type + DATE prefilled, TIME left blank.
      Submit now validates the time (blank time previously crashed).
   2. Punch Editor (Approvals → Edit Punches):
      • "Missing" In/Out cells get a "+ Add" button (prefills
        employee, that date, and in/out type)
      • "No punches" day rows get a "+ Add" button
      • Each employee header gets a "+ Punch" button
   3. Employee Profile expanded day panel gets "+ Add Punch"
      (prefills employee + that day; routes through onPunch pipeline)
   SAFETY: index.html is written ONLY if every op + check passes.
   Requires the Jul 8 QuickIssueModal patches (guard below).
   ══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const FILE = 'index.html';

if (!fs.existsSync(FILE)) {
  console.error('\u274c index.html not found \u2014 run from ~/Documents/spark-timekeep');
  process.exit(1);
}

const original = fs.readFileSync(FILE, 'utf8');
const backupName = 'index.html.backup-addpunch-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(backupName, original);
console.log('\ud83d\udce6 Backup: ' + backupName);

const hadCRLF = original.indexOf('\r\n') !== -1;
let c = hadCRLF ? original.replace(/\r\n/g, '\n') : original;
console.log('\ud83d\udcd6 Read ' + original.length + ' chars, ' + (hadCRLF ? 'CRLF' : 'LF'));

/* guard: Jul 8 patches must be applied */
if ((c.match(/function QuickIssueModal/g) || []).length !== 1) {
  console.error('\u274c GUARD: QuickIssueModal not found \u2014 Jul 8 patches missing. Aborting, nothing written.');
  process.exit(1);
}
console.log('\u2705 Guard: Jul 8 Quick Issue patches present');
console.log('');

let allOk = true;
function ok(label, note) { console.log('\u2705 ' + label + (note ? ' \u2014 ' + note : '')); }
function fail(label, msg) { allOk = false; console.log('\u274c ' + label + (msg ? ' \u2014 ' + msg : '')); }

function flexRegex(str) {
  const esc = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\u00a7WS\u00a7');
  return new RegExp(esc.split('\u00a7WS\u00a7').join('\\s+'));
}
function locate(anchor, fromIdx) {
  let i = c.indexOf(anchor, fromIdx || 0);
  if (i !== -1) return { start: i, end: i + anchor.length, mode: 'exact' };
  const m = flexRegex(anchor).exec(c.slice(fromIdx || 0));
  if (m) return { start: (fromIdx || 0) + m.index, end: (fromIdx || 0) + m.index + m[0].length, mode: 'flex' };
  return null;
}
function replaceOnce(label, oldStr, newStr) {
  const hit = locate(oldStr);
  if (!hit) { fail(label, 'anchor not found'); return; }
  const second = locate(oldStr, hit.end);
  if (second && second.mode === 'exact') { fail(label, 'anchor not unique'); return; }
  c = c.slice(0, hit.start) + newStr + c.slice(hit.end);
  ok(label, hit.mode === 'flex' ? 'matched via flexible whitespace' : undefined);
}

const BTN = 'style:{padding:"2px 8px",fontSize:10.5,background:"transparent",border:"1px solid "+(C.spark||"#FACC15"),color:C.spark||"#FACC15",borderRadius:4,cursor:"pointer",fontWeight:600}';

/* ═══ A. AddPunchModal — prefill support ═══ */

replaceOnce(
  '1. AddPunchModal \u2014 prefill prop added',
  'function AddPunchModal({\n  emps,\n  onAdd,\n  onClose,\n  staffName\n}) {',
  'function AddPunchModal({\n  emps,\n  onAdd,\n  onClose,\n  staffName,\n  prefill\n}) {'
);

replaceOnce(
  '2. AddPunchModal \u2014 employee prefilled',
  'var r1 = useState(""),\n    eid = r1[0],',
  'var r1 = useState((prefill && prefill.eid) || ""),\n    eid = r1[0],'
);

replaceOnce(
  '3. AddPunchModal \u2014 punch type prefilled',
  'var r2 = useState("in"),\n    type = r2[0],',
  'var r2 = useState((prefill && prefill.type) || "in"),\n    type = r2[0],'
);

replaceOnce(
  '4. AddPunchModal \u2014 date prefilled, time blank',
  'var r3 = useState(new Date().toISOString().slice(0, 16)),',
  'var r3 = useState((prefill && prefill.date) ? (prefill.date + "T") : new Date().toISOString().slice(0, 16)),'
);

replaceOnce(
  '5. AddPunchModal \u2014 blank-time guard on submit',
  'onAdd({\n      id: "P-M-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),\n      eid: eid,\n      type: type,\n      time: new Date(time).toISOString(),',
  'var _pdt = new Date(time);\n    if (!time || time.length < 16 || isNaN(_pdt.getTime())) { alert("Enter a time for the punch."); return; }\n    onAdd({\n      id: "P-M-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),\n      eid: eid,\n      type: type,\n      time: _pdt.toISOString(),'
);

/* ═══ B. PunchEditorPanel — add buttons ═══ */

replaceOnce(
  '6. Punch Editor \u2014 onAddPunch prop wired in',
  'var pEmps=props.emps||[],pPunches=props.punches||[],onEdit=props.onEdit,onClose=props.onClose,onPunchOut=props.onPunchOut,onDelete=props.onDelete;',
  'var pEmps=props.emps||[],pPunches=props.punches||[],onEdit=props.onEdit,onClose=props.onClose,onPunchOut=props.onPunchOut,onDelete=props.onDelete;var onAddPunch=props.onAddPunch;'
);

replaceOnce(
  '7. Punch Editor \u2014 "+ Punch" on employee header',
  ',color:parseFloat(totalHrs)>40?(C.red||"#EF4444"):(C.t1||"#E4E4E7")}},totalHrs+"h"),',
  ',color:parseFloat(totalHrs)>40?(C.red||"#EF4444"):(C.t1||"#E4E4E7")}},totalHrs+"h"),\n            onAddPunch&&React.createElement("button",{onClick:function(ev){ev.stopPropagation();onAddPunch({eid:eid})},style:{padding:"4px 10px",fontSize:11,background:"transparent",border:"1px solid "+(C.spark||"#FACC15"),color:C.spark||"#FACC15",borderRadius:4,cursor:"pointer",fontWeight:600}},"+ Punch"),'
);

replaceOnce(
  '8. Punch Editor \u2014 "+ Add" on "No punches" day rows',
  'React.createElement("span",{style:{fontSize:12,color:C.t4,fontStyle:"italic"}},"No punches")));',
  'React.createElement("span",{style:{fontSize:12,color:C.t4,fontStyle:"italic"}},"No punches"),onAddPunch&&React.createElement("button",{onClick:function(){onAddPunch({eid:eid,date:dateStr,type:"in"})},' + BTN.replace('padding:"2px 8px"', 'marginLeft:10,padding:"2px 8px"') + '},"+ Add")));'
);

replaceOnce(
  '9. Punch Editor \u2014 "+ Add" on Missing IN cells',
  'inP.edited&&React.createElement("span",{style:{color:C.spark,fontSize:10,marginLeft:4}},"*")):React.createElement("span",{style:{color:C.t4,fontSize:12}},mm?"Missing":"--"))',
  'inP.edited&&React.createElement("span",{style:{color:C.spark,fontSize:10,marginLeft:4}},"*")):React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:6}},React.createElement("span",{style:{color:C.t4,fontSize:12}},mm?"Missing":"--"),mm&&onAddPunch&&React.createElement("button",{onClick:function(){onAddPunch({eid:eid,date:dateStr,type:"in"})},' + BTN + '},"+ Add")))'
);

replaceOnce(
  '10. Punch Editor \u2014 "+ Add" on Missing OUT cells',
  'outP.edited&&React.createElement("span",{style:{color:C.spark,fontSize:10,marginLeft:4}},"*")):React.createElement("span",{style:{color:C.t4,fontSize:12}},mm?"Missing":"--"))',
  'outP.edited&&React.createElement("span",{style:{color:C.spark,fontSize:10,marginLeft:4}},"*")):React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:6}},React.createElement("span",{style:{color:C.t4,fontSize:12}},mm?"Missing":"--"),mm&&onAddPunch&&React.createElement("button",{onClick:function(){onAddPunch({eid:eid,date:dateStr,type:"out"})},' + BTN + '},"+ Add")))'
);

/* ═══ C. ManagerView wiring ═══ */

replaceOnce(
  '11. ManagerView \u2014 prefill state added',
  'var r4 = useState(false),\n    showAddPunch = r4[0],\n    setShowAddPunch = r4[1];',
  'var r4 = useState(false),\n    showAddPunch = r4[0],\n    setShowAddPunch = r4[1];\n  var r4p = useState(null), addPrefill = r4p[0], setAddPrefill = r4p[1];'
);

replaceOnce(
  '12. ManagerView \u2014 toolbar button clears stale prefill',
  'setShowAddPunch(true);',
  'setAddPrefill(null);\n      setShowAddPunch(true);'
);

replaceOnce(
  '13. ManagerView \u2014 Punch Editor gets onAddPunch',
  'showPunchEditor && /*#__PURE__*/React.createElement(PunchEditorPanel, {',
  'showPunchEditor && /*#__PURE__*/React.createElement(PunchEditorPanel, {\n    onAddPunch: function(pref){ setAddPrefill(pref || null); setShowAddPunch(true); },'
);

replaceOnce(
  '14. ManagerView \u2014 AddPunchModal receives prefill',
  'showAddPunch && /*#__PURE__*/React.createElement(AddPunchModal, {\n    emps: active,\n    onAdd: onPunch,\n    staffName: staffName,\n    onClose: function () {\n      setShowAddPunch(false);\n    }\n  })',
  'showAddPunch && /*#__PURE__*/React.createElement(AddPunchModal, {\n    emps: active,\n    onAdd: onPunch,\n    staffName: staffName,\n    prefill: addPrefill,\n    onClose: function () {\n      setShowAddPunch(false);\n      setAddPrefill(null);\n    }\n  })'
);

replaceOnce(
  '15. ManagerView \u2014 Profile gets onAddPunch (onPunch pipeline)',
  'onPunchEdit: function (p) {',
  'onAddPunch: onPunch,\n      onPunchEdit: function (p) {'
);

/* ═══ D. EmployeeProfile — day panel add ═══ */

replaceOnce(
  '16. Profile \u2014 addPunchDay state added',
  'const [quickIssue, setQuickIssue] = React.useState(null); // null | { type }',
  "const [quickIssue, setQuickIssue] = React.useState(null); // null | { type }\n  const [addPunchDay, setAddPunchDay] = React.useState(null); // null | 'YYYY-MM-DD'"
);

replaceOnce(
  '17. Profile \u2014 "+ Add Punch" in expanded day panel',
  "return panel('Punches \u00b7 ' + dayLabel,\n            React.createElement('div', null,\n              dp.length === 0",
  "return panel('Punches \u00b7 ' + dayLabel,\n            React.createElement('div', null,\n              onAddPunch && React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 6 } },\n                React.createElement('button', {\n                  onClick: function () { setAddPunchDay(dayStart.getFullYear() + '-' + String(dayStart.getMonth() + 1).padStart(2, '0') + '-' + String(dayStart.getDate()).padStart(2, '0')); },\n                  style: { padding: '4px 12px', background: 'transparent', border: '1px solid #ffc233', color: '#ffc233', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }\n                }, '+ Add Punch')\n              ),\n              dp.length === 0"
);

replaceOnce(
  '18. Profile \u2014 AddPunchModal rendered with prefill',
  'onClose: function() { setQuickIssue(null); }\n    })',
  "onClose: function() { setQuickIssue(null); }\n    })\n    ,addPunchDay && React.createElement(AddPunchModal, {\n      emps: [emp],\n      staffName: currentUser || 'Manager',\n      prefill: { eid: eid, date: addPunchDay },\n      onAdd: function(p) { if (onAddPunch) onAddPunch(p); },\n      onClose: function() { setAddPunchDay(null); }\n    })"
);

/* ═══ VERIFICATION ═══ */
console.log('\n\u2500\u2500 Verification \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
const checks = [
  ['prefill in AddPunchModal signature', c.indexOf('staffName,\n  prefill\n}) {') !== -1],
  ['Blank-time guard present', c.indexOf('Enter a time for the punch.') !== -1],
  ['Old unguarded submit removed', c.indexOf('time: new Date(time).toISOString(),') === -1],
  ['Punch Editor reads onAddPunch prop', c.indexOf('var onAddPunch=props.onAddPunch;') !== -1],
  ['Missing IN + OUT cells both patched', (c.match(/mm&&onAddPunch&&React\.createElement\("button"/g) || []).length === 2],
  ['"No punches" row add button present', c.indexOf('"No punches"),onAddPunch&&') !== -1],
  ['Employee header "+ Punch" present', c.indexOf('"+ Punch"),') !== -1],
  ['ManagerView prefill state defined', c.indexOf('addPrefill = r4p[0]') !== -1],
  ['Punch Editor wired to open modal', c.indexOf('onAddPunch: function(pref){ setAddPrefill(pref || null); setShowAddPunch(true); },') !== -1],
  ['Approvals modal gets prefill + clears on close', c.indexOf('prefill: addPrefill,') !== -1 && c.indexOf('setShowAddPunch(false);\n      setAddPrefill(null);') !== -1],
  ['Profile receives onAddPunch: onPunch', c.indexOf('onAddPunch: onPunch,') !== -1],
  ['AddPunchModal rendered in exactly 2 places', (c.match(/React\.createElement\(AddPunchModal/g) || []).length === 2],
  ['Profile day-panel add button present', c.indexOf("'+ Add Punch')") !== -1],
  ['QuickIssueModal untouched (still 1 def, 3 renders)', (c.match(/function QuickIssueModal/g) || []).length === 1 && (c.match(/React\.createElement\(QuickIssueModal/g) || []).length === 3]
];
checks.forEach(function (ch) {
  console.log((ch[1] ? '\u2705' : '\u274c') + ' ' + ch[0]);
  if (!ch[1]) allOk = false;
});

if (!allOk) {
  console.error('\n\u274c Do NOT push. index.html was NOT modified. Backup at ' + backupName);
  process.exit(1);
}

const out = hadCRLF ? c.replace(/\n/g, '\r\n') : c;
fs.writeFileSync(FILE, out);
console.log('\n\u2728 All green \u2014 wrote ' + out.length + ' chars (' + (out.length - original.length) + ' added). Safe to push.');
