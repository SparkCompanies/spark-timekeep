#!/usr/bin/env node
'use strict';
const fs = require('fs');
const FILE = 'index.html';

if (!fs.existsSync(FILE)) {
  console.error('❌ index.html not found — run from ~/Desktop/spark-timekeep');
  process.exit(1);
}

const original = fs.readFileSync(FILE, 'utf8');
const backupName = 'index.html.backup-quickissue-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(backupName, original);
console.log('📦 Backup: ' + backupName);

const hadCRLF = original.indexOf('\r\n') !== -1;
let c = hadCRLF ? original.replace(/\r\n/g, '\n') : original;
console.log('📖 Read ' + original.length + ' chars, ' + (hadCRLF ? 'CRLF' : 'LF'));
console.log('');

let allOk = true;
function ok(label, note) { console.log('✅ ' + label + (note ? ' — ' + note : '')); }
function fail(label, msg) { allOk = false; console.log('❌ ' + label + (msg ? ' — ' + msg : '')); }

function flexRegex(str) {
  const esc = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '§WS§');
  return new RegExp(esc.split('§WS§').join('\\s+'));
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
function replaceRegion(label, startAnchor, endAnchor, replacement) {
  const s = locate(startAnchor);
  if (!s) { fail(label, 'start anchor not found'); return; }
  const e = locate(endAnchor, s.end);
  if (!e) { fail(label, 'end anchor not found'); return; }
  c = c.slice(0, s.start) + replacement + c.slice(e.end);
  ok(label, (s.mode === 'flex' || e.mode === 'flex') ? 'matched via flexible whitespace' : undefined);
}

const MODAL_COMPONENT = `/* ═══ QUICK ISSUE MODAL — unified point issuing with incident date ═══ */
function QuickIssueModal({ emp, presetType, onIssue, onClose }) {
  var QI_PRESETS = [
    { k: 'tardy-short', lbl: 'Tardy (\\u226430 min)', p: 0.5 },
    { k: 'tardy-long', lbl: 'Tardy (>30 min)', p: 1 },
    { k: 'left-early', lbl: 'Left Early', p: 1 },
    { k: 'unexcused', lbl: 'Unexcused Absence', p: 1.5 },
    { k: 'no-show', lbl: 'No-Show / No-Call', p: 2 },
    { k: 'manual', lbl: 'Manual Adjustment', p: 0.5 }
  ];
  function qiLocalDate() {
    var x = new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  var initPreset = QI_PRESETS.find(function (x) { return x.k === (presetType || 'tardy-short'); }) || QI_PRESETS[0];
  var rT = React.useState(initPreset.k); var t = rT[0], setT = rT[1];
  var rP = React.useState(String(initPreset.p)); var p = rP[0], setP = rP[1];
  var todayStr = qiLocalDate();
  var rD = React.useState(todayStr); var d = rD[0], setD = rD[1];
  function changeType(nt) {
    setT(nt);
    var pr = QI_PRESETS.find(function (x) { return x.k === nt; });
    if (pr) setP(String(pr.p));
  }
  var lblStyle = { display: 'block', fontSize: 10.5, color: '#a9b3c1', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 5 };
  var inpStyle = { width: '100%', background: '#0a0d12', border: '1px solid #1f2733', color: '#e8ecf2', padding: '10px 12px', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  var ptsNum = parseFloat(p);
  var isBackdated = d !== todayStr;
  return React.createElement('div', { onClick: onClose, style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 } },
    React.createElement('div', { onClick: function (e) { e.stopPropagation(); }, style: { background: '#11151c', border: '1px solid #1f2733', borderRadius: 12, padding: 24, width: 420, maxWidth: '92%' } },
      React.createElement('div', { style: { fontSize: 10.5, color: '#ffc233', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 } }, 'Quick Issue Point'),
      React.createElement('div', { style: { fontSize: 18, fontWeight: 700, marginBottom: 18, color: '#e8ecf2' } }, emp ? ((emp.fn || '') + ' ' + (emp.ln || '')) : 'Employee'),
      React.createElement('div', { style: { marginBottom: 12 } },
        React.createElement('label', { style: lblStyle }, 'Violation Type'),
        React.createElement('select', { value: t, onChange: function (e) { changeType(e.target.value); }, style: inpStyle },
          QI_PRESETS.map(function (r) { return React.createElement('option', { key: r.k, value: r.k }, r.lbl + ' (+' + r.p + ')'); })
        )
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 } },
        React.createElement('div', null,
          React.createElement('label', { style: lblStyle }, 'Points'),
          React.createElement('input', { type: 'number', step: '0.5', value: p, onChange: function (e) { setP(e.target.value); }, style: Object.assign({}, inpStyle, { border: '2px solid #ffc233', color: '#ffc233', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }) })
        ),
        React.createElement('div', null,
          React.createElement('label', { style: lblStyle }, 'Incident Date'),
          React.createElement('input', { type: 'date', value: d, max: todayStr, onChange: function (e) { setD(e.target.value); }, style: Object.assign({}, inpStyle, { fontFamily: "'IBM Plex Mono',monospace" }) })
        )
      ),
      isBackdated && React.createElement('div', { style: { marginBottom: 14, padding: '7px 10px', background: 'rgba(255,194,51,0.08)', border: '1px solid rgba(255,194,51,0.25)', borderRadius: 6, fontSize: 11.5, color: '#ffc233' } },
        'Backdated — rolling-window expiration runs from the incident date'
      ),
      React.createElement('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 } },
        React.createElement('button', { onClick: onClose, style: { padding: '10px 18px', background: 'transparent', border: '1px solid #1f2733', color: '#a9b3c1', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 } }, 'Cancel'),
        React.createElement('button', {
          onClick: function () {
            var ptsVal = parseFloat(p);
            if (isNaN(ptsVal) || ptsVal === 0) { alert('Enter a non-zero points value.'); return; }
            if (!d) { alert('Pick an incident date.'); return; }
            if (d > todayStr) { alert('Incident date cannot be in the future.'); return; }
            var dt = new Date(d + 'T12:00:00');
            if (isNaN(dt.getTime())) { alert('Invalid date.'); return; }
            onIssue(t, ptsVal, dt.toISOString());
          },
          style: { padding: '10px 22px', background: '#ffc233', border: 'none', color: '#000', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }
        }, 'Issue ' + (isNaN(ptsNum) ? '' : (ptsNum > 0 ? '+' : '') + ptsNum) + ' pts')
      )
    )
  );
}

`;

replaceOnce(
  '1. QuickIssueModal component added',
  '/* \u2550\u2550\u2550 MAIN APP \u2550\u2550\u2550 */',
  '/* \u2550\u2550\u2550 MAIN APP \u2550\u2550\u2550 */\n\n' + MODAL_COMPONENT
);

replaceOnce(
  '2. Directory — modal state added',
  "var rss = React.useState('active'), statusFilter = rss[0], setStatusFilter = rss[1];",
  "var rss = React.useState('active'), statusFilter = rss[0], setStatusFilter = rss[1];\n  var rqi = React.useState(null), quickIssueFor = rqi[0], setQuickIssueFor = rqi[1];"
);

replaceRegion(
  '3. Directory \u22ef menu — prompt() replaced with modal',
  'if(!onIssuePoint) return;\n                var menu = [',
  'onIssuePoint(e.id, menu[idx].key);\n              },',
  'if(!onIssuePoint) return;\n                setQuickIssueFor(e);\n              },'
);

replaceOnce(
  '4. Directory — modal rendered',
  "    // Empty state\n    list.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: 60, color: '#5b6473', fontSize: 13 } }, 'No employees match those filters.'),",
  "    quickIssueFor && React.createElement(QuickIssueModal, {\n      emp: quickIssueFor,\n      onIssue: function(type, pts, dateISO) { if (onIssuePoint) onIssuePoint(quickIssueFor.id, type, pts, dateISO); setQuickIssueFor(null); },\n      onClose: function() { setQuickIssueFor(null); }\n    }),\n\n    // Empty state\n    list.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: 60, color: '#5b6473', fontSize: 13 } }, 'No employees match those filters.'),"
);

replaceOnce(
  '5. Profile — modal state added',
  'const [expandedCell, setExpandedCell] = React.useState(null); // {weekIdx, dayIdx} or null',
  'const [expandedCell, setExpandedCell] = React.useState(null); // {weekIdx, dayIdx} or null\n  const [quickIssue, setQuickIssue] = React.useState(null); // null | { type }'
);

replaceRegion(
  '6. Profile toolbar — confirm() flow replaced with modal',
  "if (!confirm('Issue ' + r.lbl + ' (+' + r.pts + ' pts) to ' + emp.fn + ' ' + emp.ln + '?')) return;",
  "} catch(e) { alert('Error: ' + e.message); }\n              },",
  "setQuickIssue({ type: r.k });\n              },"
);

replaceRegion(
  '7. Profile Custom \u00b1 — prompt() replaced with modal',
  "var amtStr = prompt('Custom adjustment for '",
  "} catch(e) { alert('Error: ' + e.message); }\n            },",
  "setQuickIssue({ type: 'manual' });\n            },"
);

replaceOnce(
  '8. Profile — modal rendered with Supabase save',
  '  );\n}\n\n// \u2500\u2500 small helpers used by EmployeeProfile',
  `    ,quickIssue && React.createElement(QuickIssueModal, {
      emp: emp,
      presetType: quickIssue.type,
      onIssue: async function(type, ptsVal, dateISO) {
        var newEv = { id: 'PE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), eid: eid, type: type, pts: ptsVal, date: dateISO };
        try {
          var sb = window._sb;
          if (sb) {
            var res = await sb.from('tk_point_events').insert(newEv);
            if (res.error) { alert('Failed to save: ' + res.error.message); return; }
          }
          setPoints(function(prev) { return [newEv].concat(prev); });
          setQuickIssue(null);
        } catch(e) { alert('Error: ' + e.message); }
      },
      onClose: function() { setQuickIssue(null); }
    })
  );
}

// \u2500\u2500 small helpers used by EmployeeProfile`
);

replaceOnce(
  '9. Drilldown — modal state added',
  'var Fm="\'JetBrains Mono\',monospace";\n  var mo=useMobile();',
  'var Fm="\'JetBrains Mono\',monospace";\n  var mo=useMobile();\n  var rQI=React.useState(null),qiType=rQI[0],setQiType=rQI[1];'
);

replaceOnce(
  '10. Drilldown Issue Points — date prompt() replaced with modal',
  'onClick:function(){var d=prompt("Date for this violation (YYYY-MM-DD):",new Date().toISOString().slice(0,10));if(d)onIssuePoint(emp.id,r.k,undefined,d+"T12:00:00.000Z")}',
  'onClick:function(){setQiType(r.k)}'
);

replaceOnce(
  '11. Drilldown — modal rendered',
  'r.v," (+",r.p,")")\n      }))',
  'r.v," (+",r.p,")")\n      })),\n      qiType && React.createElement(QuickIssueModal,{emp:emp,presetType:qiType,onIssue:function(type,pts,dateISO){onIssuePoint(emp.id,type,pts,dateISO);setQiType(null)},onClose:function(){setQiType(null)}})'
);

function replaceAllColor(label, from, to) {
  const n = c.split(from).length - 1;
  if (n === 0) { fail(label, 'color not found in file'); return; }
  c = c.split(from).join(to);
  ok(label, n + ' occurrences');
}
replaceAllColor('12. Contrast — headers/labels #5b6473 \u2192 #7f8a9b', '#5b6473', '#7f8a9b');
replaceAllColor('13. Contrast — dept/last-punch #8993a4 \u2192 #a9b3c1', '#8993a4', '#a9b3c1');

console.log('\n\u2500\u2500 Verification \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
const checks = [
  ['QuickIssueModal defined exactly once', (c.match(/function QuickIssueModal/g) || []).length === 1],
  ['Modal rendered in 3 places (directory, profile, drilldown)', (c.match(/React\.createElement\(QuickIssueModal/g) || []).length === 3],
  ['Old directory prompt removed', c.indexOf('Quick Issue Point for') === -1],
  ['Old profile confirm flow removed', c.indexOf("confirm('Issue ' + r.lbl") === -1],
  ['Old Custom \u00b1 prompt removed', c.indexOf('Custom adjustment for') === -1],
  ['Old drilldown date prompt removed', c.indexOf('Date for this violation') === -1],
  ['No #5b6473 remaining', c.indexOf('#5b6473') === -1],
  ['No #8993a4 remaining', c.indexOf('#8993a4') === -1],
  ['Bulk Issue modal untouched (already had date picker)', c.indexOf('Bulk Issue Points') !== -1]
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
