#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   SPARK TIMEKEEP — Patch 2: ± adjustments get the incident date too
   Requires patch-quickissue-contrast-jul8.cjs applied FIRST.
   1. QuickIssueModal accepts presetPts (prefill −0.5 / +0.5)
   2. Directory − / + buttons open the modal instead of confirm()
   3. Directory ⋯ + modal render updated for the new state shape
   SAFETY: index.html is written ONLY if every op + check passes.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const FILE = 'index.html';

if (!fs.existsSync(FILE)) {
  console.error('❌ index.html not found — run from ~/Desktop/spark-timekeep');
  process.exit(1);
}

const original = fs.readFileSync(FILE, 'utf8');

/* ── Guard: patch 1 must be applied ── */
if (original.indexOf('function QuickIssueModal') === -1) {
  console.error('❌ QuickIssueModal not found — run patch-quickissue-contrast-jul8.cjs FIRST, then re-run this. index.html was NOT modified.');
  process.exit(1);
}

const backupName = 'index.html.backup-plusminus-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
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

/* ═══ 1. Modal signature accepts presetPts ═══ */
replaceOnce(
  '1. Modal — presetPts param added',
  'function QuickIssueModal({ emp, presetType, onIssue, onClose }) {',
  'function QuickIssueModal({ emp, presetType, presetPts, onIssue, onClose }) {'
);

/* ═══ 2. Modal points state honors presetPts ═══ */
replaceOnce(
  '2. Modal — points prefill from presetPts',
  'var rP = React.useState(String(initPreset.p)); var p = rP[0], setP = rP[1];',
  'var rP = React.useState(String(presetPts !== undefined && presetPts !== null ? presetPts : initPreset.p)); var p = rP[0], setP = rP[1];'
);

/* ═══ 3. Directory − button → modal ═══ */
replaceOnce(
  '3. Directory \u2212 button — confirm() replaced with modal',
  "onClick: function(ev){ ev.stopPropagation(); if(onIssuePoint && data.totalPts > 0) { if(confirm('Remove 0.5 point from ' + e.fn + ' ' + e.ln + '?')) onIssuePoint(e.id, 'manual', -0.5); } },",
  "onClick: function(ev){ ev.stopPropagation(); if(onIssuePoint && data.totalPts > 0) setQuickIssueFor({ emp: e, presetType: 'manual', presetPts: -0.5 }); },"
);

/* ═══ 4. Directory + button → modal ═══ */
replaceOnce(
  '4. Directory + button — confirm() replaced with modal',
  "onClick: function(ev){ ev.stopPropagation(); if(onIssuePoint) { if(confirm('Add 0.5 point to ' + e.fn + ' ' + e.ln + '?')) onIssuePoint(e.id, 'manual', 0.5); } },",
  "onClick: function(ev){ ev.stopPropagation(); if(onIssuePoint) setQuickIssueFor({ emp: e, presetType: 'manual', presetPts: 0.5 }); },"
);

/* ═══ 5. Directory ⋯ handler → new state shape ═══ */
replaceOnce(
  '5. Directory \u22ef — state shape updated',
  'if(!onIssuePoint) return;\n                setQuickIssueFor(e);',
  'if(!onIssuePoint) return;\n                setQuickIssueFor({ emp: e });'
);

/* ═══ 6. Directory modal render → new state shape ═══ */
replaceOnce(
  '6. Directory modal render — new state shape wired',
  "    quickIssueFor && React.createElement(QuickIssueModal, {\n      emp: quickIssueFor,\n      onIssue: function(type, pts, dateISO) { if (onIssuePoint) onIssuePoint(quickIssueFor.id, type, pts, dateISO); setQuickIssueFor(null); },\n      onClose: function() { setQuickIssueFor(null); }\n    }),",
  "    quickIssueFor && React.createElement(QuickIssueModal, {\n      emp: quickIssueFor.emp,\n      presetType: quickIssueFor.presetType,\n      presetPts: quickIssueFor.presetPts,\n      onIssue: function(type, pts, dateISO) { if (onIssuePoint) onIssuePoint(quickIssueFor.emp.id, type, pts, dateISO); setQuickIssueFor(null); },\n      onClose: function() { setQuickIssueFor(null); }\n    }),"
);

/* ═══ VERIFICATION ═══ */
console.log('\n\u2500\u2500 Verification \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
const checks = [
  ['presetPts in modal signature', c.indexOf('function QuickIssueModal({ emp, presetType, presetPts, onIssue, onClose })') !== -1],
  ['presetPts prefill logic present', c.indexOf('presetPts !== undefined && presetPts !== null ? presetPts : initPreset.p') !== -1],
  ["Old 'Remove 0.5 point' confirm removed", c.indexOf('Remove 0.5 point from') === -1],
  ["Old 'Add 0.5 point' confirm removed", c.indexOf('Add 0.5 point to') === -1],
  ['\u2212 opens modal with presetPts: -0.5', c.indexOf("setQuickIssueFor({ emp: e, presetType: 'manual', presetPts: -0.5 })") !== -1],
  ['+ opens modal with presetPts: 0.5', c.indexOf("setQuickIssueFor({ emp: e, presetType: 'manual', presetPts: 0.5 })") !== -1],
  ['\u22ef uses new state shape', c.indexOf('setQuickIssueFor({ emp: e });') !== -1],
  ['Render reads quickIssueFor.emp.id', c.indexOf('onIssuePoint(quickIssueFor.emp.id, type, pts, dateISO)') !== -1],
  ['No stale bare setQuickIssueFor(e) left', c.indexOf('setQuickIssueFor(e);') === -1],
  ['Still exactly 3 modal renders', (c.match(/React\.createElement\(QuickIssueModal/g) || []).length === 3]
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
console.log('\n\u2728 All green \u2014 wrote ' + out.length + ' chars (' + (out.length - original.length) + ' net). Safe to push.');
