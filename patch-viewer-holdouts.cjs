// patch-viewer-holdouts.cjs
// Closes the remaining viewer-mode leaks:
//   - "Switch to Admin View" button
//   - Violation Approve / Dismiss buttons (Auto-Detected Violations)
//   - "Approve All" weekly approval button
//   - Alert Center "Dismiss" + "Dismiss Visible" buttons
//
// Run from ~/Documents/spark-timekeep with: node patch-viewer-holdouts.cjs
// Make sure line endings are LF first:  sed -i 's/\r$//' index.html

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html.length;
console.log(`Read ${before} chars`);

// Backup
fs.writeFileSync(file + '.bak-viewer-holdouts', html);
console.log('Backup → index.html.bak-viewer-holdouts');

let changes = 0;
function done(label) { changes++; console.log(`✅ ${label}`); }
function fail(label) { console.error(`❌ ${label}`); process.exit(1); }

// ───────────────────────────────────────────────────────────────
// H1: Hide "Switch to Admin View" button for viewers
// Existing: onSwitchView && React.createElement("div",...,"Switch to Admin View"))
// Change to: !readOnly && onSwitchView && ...
// ───────────────────────────────────────────────────────────────
{
  const OLD = '})), onSwitchView && React.createElement("div",{style:{marginBottom:12}},React.createElement("button",{onClick:onSwitchView,';
  const NEW = '})), !readOnly && onSwitchView && React.createElement("div",{style:{marginBottom:12}},React.createElement("button",{onClick:onSwitchView,';
  if (html.includes('!readOnly && onSwitchView &&')) {
    console.log('⚠️  H1 skip — Switch to Admin View already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H1: Switch to Admin View wrapped with !readOnly');
  } else {
    fail('H1: could not find Switch to Admin View anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// H2: Hide violation Approve button (issues point + dismisses)
// Anchor: the onClick calls onIssuePoint(v.eid, v.type, ...)
// ───────────────────────────────────────────────────────────────
{
  const OLD = `rule.v, " (+", v.pts, ")"), /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        onIssuePoint(v.eid, v.type, undefined, v.day.toISOString());`;
  const NEW = `rule.v, " (+", v.pts, ")"), !readOnly && /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        onIssuePoint(v.eid, v.type, undefined, v.day.toISOString());`;
  if (html.includes('rule.v, " (+", v.pts, ")"), !readOnly && /*#__PURE__*/React.createElement("button"')) {
    console.log('⚠️  H2 skip — violation Approve already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H2: violation Approve button wrapped');
  } else {
    fail('H2: could not find violation Approve anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// H3: Hide violation Dismiss button
// Anchor: "Approve"), /*#__PURE__*/React.createElement("button", {
//          onClick: function () {
//            setDismissed(Object.assign({}, dismissed, function () {
// (the dismiss-only version that doesn't issue point)
// ───────────────────────────────────────────────────────────────
{
  const OLD = `    }, "Approve"), /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        setDismissed(Object.assign({}, dismissed, function () {`;
  const NEW = `    }, "Approve"), !readOnly && /*#__PURE__*/React.createElement("button", {
      onClick: function () {
        setDismissed(Object.assign({}, dismissed, function () {`;
  if (html.includes('}, "Approve"), !readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function () {\n        setDismissed')) {
    console.log('⚠️  H3 skip — violation Dismiss already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H3: violation Dismiss button wrapped');
  } else {
    fail('H3: could not find violation Dismiss anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// H4: Hide per-employee weekly "Approve" timesheet button
// Anchor: ev.stopPropagation(); ...; setApprovals(nxt)
// ───────────────────────────────────────────────────────────────
{
  const OLD = `: /*#__PURE__*/React.createElement("button", {
      onClick: function (ev) {
        ev.stopPropagation();
        var wk=mon.toISOString().slice(0,10);var nxt=Object.assign({},approvals);nxt[e.id+"-"+wk]="approved";setApprovals(nxt);try{localStorage.setItem("tk-approvals",JSON.stringify(nxt))}catch(ex){}`;
  const NEW = `: !readOnly && /*#__PURE__*/React.createElement("button", {
      onClick: function (ev) {
        ev.stopPropagation();
        var wk=mon.toISOString().slice(0,10);var nxt=Object.assign({},approvals);nxt[e.id+"-"+wk]="approved";setApprovals(nxt);try{localStorage.setItem("tk-approvals",JSON.stringify(nxt))}catch(ex){}`;
  if (html.includes(': !readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function (ev) {\n        ev.stopPropagation();')) {
    console.log('⚠️  H4 skip — per-row Approve already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H4: per-row weekly Approve button wrapped');
  } else {
    fail('H4: could not find per-row Approve anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// H5: Hide "Approve All" weekly bulk button
// Anchor: var wk2=mon.toISOString()...active.forEach... "Approve All"
// ───────────────────────────────────────────────────────────────
{
  const OLD = `, " approved"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      var wk2=mon.toISOString().slice(0,10);var all=Object.assign({},approvals);
      active.forEach(function (e) {
        all[e.id+"-"+wk2]="approved";
      });`;
  const NEW = `, " approved"), !readOnly && /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      var wk2=mon.toISOString().slice(0,10);var all=Object.assign({},approvals);
      active.forEach(function (e) {
        all[e.id+"-"+wk2]="approved";
      });`;
  if (html.includes(', " approved"), !readOnly && /*#__PURE__*/React.createElement("button"')) {
    console.log('⚠️  H5 skip — Approve All already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H5: Approve All button wrapped');
  } else {
    fail('H5: could not find Approve All anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// H6: Hide "Dismiss Visible" bulk button in Alert Center
// Anchor: confirm("Dismiss "+visible.length+" visible alerts?")
// ───────────────────────────────────────────────────────────────
{
  const OLD = '/*#__PURE__*/React.createElement("button",{onClick:function(){var visible=alerts.filter(function(a){if(dismissedAlerts[a.id||"a"+alerts.indexOf(a)])return false;if(alertFilter!=="all"&&String(a.sev||0)!==alertFilter)return false;if(alertSearch){var s=alertSearch.toLowerCase();if(!a.emp||(a.emp.fn+" "+a.emp.ln).toLowerCase().indexOf(s)===-1)return false}return true});if(visible.length===0)return;if(!confirm("Dismiss "+visible.length+" visible alerts?"))return;';
  const NEW = '!readOnly && /*#__PURE__*/React.createElement("button",{onClick:function(){var visible=alerts.filter(function(a){if(dismissedAlerts[a.id||"a"+alerts.indexOf(a)])return false;if(alertFilter!=="all"&&String(a.sev||0)!==alertFilter)return false;if(alertSearch){var s=alertSearch.toLowerCase();if(!a.emp||(a.emp.fn+" "+a.emp.ln).toLowerCase().indexOf(s)===-1)return false}return true});if(visible.length===0)return;if(!confirm("Dismiss "+visible.length+" visible alerts?"))return;';
  if (html.includes('!readOnly && /*#__PURE__*/React.createElement("button",{onClick:function(){var visible=alerts.filter')) {
    console.log('⚠️  H6 skip — Dismiss Visible already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H6: Dismiss Visible bulk button wrapped');
  } else {
    fail('H6: could not find Dismiss Visible anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// H7: Hide per-alert "Dismiss" button in Alert Center
// Anchor: "View"), ...React.createElement("button",{onClick:function(){var nd=Object.assign({},dismissedAlerts);
// ───────────────────────────────────────────────────────────────
{
  const OLD = '"View"), /*#__PURE__*/React.createElement("button",{onClick:function(){var nd=Object.assign({},dismissedAlerts);nd[a.id||"a"+alerts.indexOf(a)]=true;setDismissedAlerts(nd)}';
  const NEW = '"View"), !readOnly && /*#__PURE__*/React.createElement("button",{onClick:function(){var nd=Object.assign({},dismissedAlerts);nd[a.id||"a"+alerts.indexOf(a)]=true;setDismissedAlerts(nd)}';
  if (html.includes('"View"), !readOnly && /*#__PURE__*/React.createElement("button",{onClick:function(){var nd=Object.assign')) {
    console.log('⚠️  H7 skip — per-alert Dismiss already wrapped');
  } else if (html.includes(OLD)) {
    html = html.replace(OLD, NEW);
    done('H7: per-alert Dismiss button wrapped');
  } else {
    fail('H7: could not find per-alert Dismiss anchor');
  }
}

// ───────────────────────────────────────────────────────────────
// VERIFICATION
// ───────────────────────────────────────────────────────────────
console.log('\n── Verification ──────────────────────────');

const checks = [
  ['Switch to Admin wrapped', '!readOnly && onSwitchView &&'],
  ['Violation Approve wrapped', 'rule.v, " (+", v.pts, ")"), !readOnly &&'],
  ['Violation Dismiss wrapped', '"Approve"), !readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function () {\n        setDismissed'],
  ['Per-row Approve wrapped', ': !readOnly && /*#__PURE__*/React.createElement("button", {\n      onClick: function (ev) {\n        ev.stopPropagation();'],
  ['Approve All wrapped', ', " approved"), !readOnly &&'],
  ['Dismiss Visible wrapped', '!readOnly && /*#__PURE__*/React.createElement("button",{onClick:function(){var visible=alerts.filter'],
  ['Per-alert Dismiss wrapped', '"View"), !readOnly && /*#__PURE__*/React.createElement("button",{onClick:function(){var nd=Object.assign'],
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
console.log('  git commit -m "fix: close viewer holdouts (switch view, violations, approvals, alert dismiss)"');
console.log('  git push');
