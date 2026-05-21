// ═══════════════════════════════════════════════════════════════════
// SPARK TIMEKEEP — COMMAND CENTER
// Big-board manager dashboard. Renders 7 panels: KPI strip, Heat of
// Day, Live Status Board, Department Breakdown, Live Alerts, Labor
// Cost gauge, Action Queue.
//
// Loaded as a separate file from index.html so this component can
// be edited and deployed without patching the giant index.html.
// Exposes itself as window.CommandCenter.
//
// Props (passed from the manager component in index.html):
//   employees, punches, policy, statuses, clockedIn, onBreak, notIn,
//   allExcs, otCount, atRisk, totalLabor, alerts, dismissedAlerts,
//   pending, mon, weekOffset, search, dept,
//   onDismissAlert, onOpenEmp, onSwitchTab
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  function CommandCenter(props) {
    var employees       = props.employees || [];
    var punches         = props.punches || [];
    var policy          = props.policy || {};
    var clockedIn       = props.clockedIn || [];
    var onBreak         = props.onBreak || [];
    var allExcs         = props.allExcs || [];
    var otCount         = props.otCount || 0;
    var atRisk          = props.atRisk || [];
    var totalLabor      = props.totalLabor || 0;
    var alerts          = props.alerts || [];
    var dismissedAlerts = props.dismissedAlerts || {};
    var pending         = props.pending || [];
    var weekOffset      = props.weekOffset || 0;
    var search          = props.search || '';
    var dept            = props.dept || 'all';
    var onOpenEmp       = props.onOpenEmp || function () {};
    var onSwitchTab     = props.onSwitchTab || function () {};

    // ── theme tokens (match the rest of the app) ─────────────────
    var C = {
      bg:    '#0a0d12',
      srf:   '#11151c',
      srf2:  '#161b24',
      bd:    '#1f2733',
      bds:   '#1a2029',
      t1:    '#e8ecf2',
      t2:    '#cbd5e1',
      t3:    '#8993a4',
      t4:    '#5b6473',
      spark: '#ffc233',
      green: '#22c55e',
      red:   '#ef4444',
      amber: '#f59e0b',
      blue:  '#38bdf8',
      purple:'#a78bfa',
      teal:  '#2dd4bf'
    };
    var Fm = 'JetBrains Mono, monospace';

    // ── derived universe (apply search + dept filters) ──────────
    var active = employees.filter(function (e) { return e.st === 'active'; });

    function passesFilters(e) {
      if (dept !== 'all' && e.dept !== dept) return false;
      if (search) {
        var s = search.toLowerCase();
        var nm = ((e.fn || '') + ' ' + (e.ln || '')).toLowerCase();
        if (nm.indexOf(s) === -1 &&
            (e.badge || '').indexOf(s) === -1 &&
            (e.dept || '').toLowerCase().indexOf(s) === -1) return false;
      }
      return true;
    }

    var fActive    = active.filter(passesFilters);
    var fClockedIn = clockedIn.filter(passesFilters);
    var fOnBreak   = onBreak.filter(passesFilters);

    // ── attendance + hours derived metrics ──────────────────────
    var attRate = fActive.length > 0
      ? Math.round(((fClockedIn.length + fOnBreak.length) / fActive.length) * 1000) / 10
      : 0;

    var todayStr = new Date().toISOString().slice(0, 10);
    var hoursToday = 0;
    fActive.forEach(function (e) {
      var ep = punches.filter(function (p) {
        return p.eid === e.id && (p.time || '').slice(0, 10) === todayStr;
      }).sort(function (a, b) { return new Date(a.time) - new Date(b.time); });
      var openIn = null;
      ep.forEach(function (p) {
        var t = new Date(p.time);
        if (p.type === 'in' && !openIn) openIn = t;
        else if (p.type === 'out' && openIn) { hoursToday += (t - openIn) / 3600000; openIn = null; }
      });
      if (openIn) hoursToday += (Date.now() - openIn) / 3600000;
    });

    // ── data integrity flag: future-dated punches ──────────────
    var nowMs = Date.now();
    var futurePunches = punches.filter(function (p) {
      return new Date(p.time).getTime() > nowMs + 90000;
    });

    // ── no-shows + late from exceptions ────────────────────────
    var noShowToday = fActive.filter(function (e) {
      if (fClockedIn.find(function (c) { return c.id === e.id; })) return false;
      if (fOnBreak.find(function (c) { return c.id === e.id; })) return false;
      return !!e.shift;
    });

    var late = [];
    if (Array.isArray(allExcs)) {
      late = allExcs.filter(function (x) {
        var t = ((x.type || x.code || '') + '').toLowerCase();
        return t.indexOf('late') > -1 || t.indexOf('tardy') > -1;
      });
    }

    // ── labor budget pct (optional from policy) ─────────────────
    var dailyBudget = policy.dailyLaborBudget || 0;
    var laborPct = dailyBudget > 0 ? Math.min(150, Math.round((totalLabor / dailyBudget) * 100)) : null;

    // ── shared style helpers ────────────────────────────────────
    var panelStyle = { background: C.srf, border: '1px solid ' + C.bd, borderRadius: 12, overflow: 'hidden' };
    var panelHeadStyle = { padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + C.bds };
    var panelTitleStyle = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: C.t1 };
    var panelBodyStyle = { padding: '16px 18px' };

    function kpi(label, value, accent, sub, onClick) {
      return React.createElement('div', {
        onClick: onClick,
        style: {
          background: C.srf,
          border: '1px solid ' + C.bd,
          borderRadius: 10,
          padding: '14px 16px',
          cursor: onClick ? 'pointer' : 'default',
          borderTop: '2px solid ' + accent
        }
      },
        React.createElement('div', { style: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.8, color: C.t4, fontWeight: 600, marginBottom: 6 } }, label),
        React.createElement('div', { style: { fontFamily: Fm, fontSize: 22, fontWeight: 700, lineHeight: 1 } }, value),
        sub && React.createElement('div', { style: { fontSize: 11, color: C.t3, marginTop: 4 } }, sub)
      );
    }

    function panel(title, meta, body) {
      return React.createElement('div', { style: panelStyle },
        React.createElement('div', { style: panelHeadStyle },
          React.createElement('div', { style: panelTitleStyle }, title),
          meta && React.createElement('div', { style: { color: C.t3, fontSize: 11.5 } }, meta)
        ),
        React.createElement('div', { style: panelBodyStyle }, body)
      );
    }

    function initials(e) {
      var s = ((e.fn || '') + ' ' + (e.ln || '')).split(' ').map(function (p) { return p[0]; }).filter(Boolean).join('');
      return (s || '?').slice(0, 2).toUpperCase();
    }

    function personCard(e, timeText, timeColor) {
      return React.createElement('div', {
        key: e.id,
        onClick: function () { onOpenEmp(e.id); },
        style: {
          background: C.srf,
          border: '1px solid ' + C.bds,
          borderRadius: 6,
          padding: '8px 10px',
          marginBottom: 4,
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: '24px 1fr auto',
          gap: 8,
          alignItems: 'center'
        }
      },
        React.createElement('div', { style: { width: 24, height: 24, borderRadius: 5, background: 'linear-gradient(135deg, #2a3441, #1a2029)', color: C.spark, fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, initials(e)),
        React.createElement('div', { style: { minWidth: 0 } },
          React.createElement('div', { style: { fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, (e.fn || '') + ' ' + (e.ln || '')),
          React.createElement('div', { style: { fontFamily: Fm, fontSize: 10, color: C.t3 } }, (e.badge || '—') + ' · ' + (e.dept || '—'))
        ),
        React.createElement('div', { style: { fontFamily: Fm, fontSize: 10.5, color: timeColor || C.t4, fontWeight: 600 } }, timeText || '')
      );
    }

    function timeAgo(t) {
      var d = new Date(t);
      if (isNaN(d)) return '';
      var s = Math.floor((Date.now() - d) / 1000);
      if (s < 60) return s + 's ago';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago';
      return Math.floor(s / 86400) + 'd ago';
    }

    // ── Heat-of-Day: bucket today's headcount by hour ───────────
    var hodHours = [];
    for (var hh = 5; hh <= 23; hh++) hodHours.push(hh);
    var hod = {};
    hodHours.forEach(function (h) { hod[h] = { working: 0, brk: 0 }; });
    var nowH = new Date().getHours();

    fActive.forEach(function (e) {
      var ep = punches.filter(function (p) {
        return p.eid === e.id && (p.time || '').slice(0, 10) === todayStr;
      }).sort(function (a, b) { return new Date(a.time) - new Date(b.time); });

      var openIn = null, openBO = null;
      var intervals = [];
      ep.forEach(function (p) {
        var t = new Date(p.time);
        if (p.type === 'in') openIn = t;
        else if (p.type === 'out' && openIn) { intervals.push({ start: openIn, end: t, kind: 'working' }); openIn = null; }
        else if (p.type === 'break-out' && openIn) { intervals.push({ start: openIn, end: t, kind: 'working' }); openBO = t; openIn = null; }
        else if (p.type === 'break-in' && openBO) { intervals.push({ start: openBO, end: t, kind: 'break' }); openIn = t; openBO = null; }
      });
      var endOfDay = new Date(todayStr + 'T23:59:59');
      var cap = Date.now() < endOfDay ? Date.now() : endOfDay;
      if (openIn) intervals.push({ start: openIn, end: new Date(cap), kind: 'working' });
      if (openBO) intervals.push({ start: openBO, end: new Date(cap), kind: 'break' });

      hodHours.forEach(function (hourMark) {
        var hourStart = new Date(todayStr + 'T00:00:00');
        hourStart.setHours(hourMark);
        var hourEnd = new Date(hourStart);
        hourEnd.setHours(hourMark + 1);
        intervals.forEach(function (iv) {
          if (iv.start < hourEnd && iv.end > hourStart) {
            if (iv.kind === 'break') hod[hourMark].brk++;
            else hod[hourMark].working++;
          }
        });
      });
    });

    var maxStack = 1;
    hodHours.forEach(function (h) {
      var t = hod[h].working + hod[h].brk;
      if (t > maxStack) maxStack = t;
    });

    // ── Department breakdown ────────────────────────────────────
    var deptMap = {};
    fActive.forEach(function (e) {
      var d = e.dept || 'No Dept';
      if (!deptMap[d]) deptMap[d] = { total: 0, working: 0, brk: 0, off: 0 };
      deptMap[d].total++;
      if (fClockedIn.find(function (c) { return c.id === e.id; })) deptMap[d].working++;
      else if (fOnBreak.find(function (c) { return c.id === e.id; })) deptMap[d].brk++;
      else deptMap[d].off++;
    });
    var deptList = Object.keys(deptMap).sort(function (a, b) {
      return deptMap[b].total - deptMap[a].total;
    });

    // ── Alerts (live, not dismissed) ───────────────────────────
    var liveAlerts = (alerts || []).filter(function (a, i) {
      return !dismissedAlerts[a.id || 'a' + i];
    }).slice(0, 10);

    // ════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════
    return React.createElement('div', { style: { color: C.t1 } },

      // ── KPI STRIP ───────────────────────────────────────────
      React.createElement('div', {
        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 16 }
      },
        kpi('On Clock Now', fClockedIn.length + ' / ' + fActive.length, C.spark, null, function () { onSwitchTab('whos-in'); }),
        kpi('On Break',     fOnBreak.length,           C.blue,   fOnBreak.length === 0 ? 'none' : null),
        kpi('Late Today',   late.length,               C.amber,  late.length > 0 ? 'needs review' : null),
        kpi('No-Show',      noShowToday.length,        C.red,    noShowToday.length > 0 ? 'no punch yet' : null),
        kpi('Attendance',   attRate + '%',             C.green,  'of ' + fActive.length + ' active'),
        kpi('Hours Today',  hoursToday.toFixed(0),     C.purple, 'cumulative'),
        kpi('Labor Cost',   '$' + Math.round(totalLabor).toLocaleString(), C.teal, laborPct ? laborPct + '% of budget' : 'this week'),
        kpi('Open Issues',  allExcs.length + futurePunches.length, futurePunches.length > 0 ? C.red : C.amber, futurePunches.length > 0 ? futurePunches.length + ' critical' : null)
      ),

      // ── BOARD GRID ──────────────────────────────────────────
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 16 } },

        // LEFT COLUMN
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },

          // Heat of Day
          panel('Heat of Day · headcount by hour', 'today',
            React.createElement('div', null,
              React.createElement('div', {
                style: { display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, padding: '4px 0', borderLeft: '1px solid ' + C.bd, borderBottom: '1px solid ' + C.bd }
              },
                hodHours.map(function (h) {
                  var d = hod[h];
                  return React.createElement('div', {
                    key: h,
                    style: { flex: 1, display: 'flex', flexDirection: 'column-reverse', height: '100%', position: 'relative' }
                  },
                    React.createElement('div', {
                      title: h + ':00 — ' + d.working + ' working' + (d.brk > 0 ? ', ' + d.brk + ' on break' : ''),
                      style: { background: C.green, height: (d.working / maxStack * 100) + '%', borderRadius: '2px 2px 0 0' }
                    }),
                    d.brk > 0 && React.createElement('div', {
                      style: { background: C.blue, height: (d.brk / maxStack * 100) + '%' }
                    }),
                    h === nowH && React.createElement('div', {
                      style: { position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontFamily: Fm, fontSize: 9, color: C.spark, fontWeight: 700, letterSpacing: 0.5 }
                    }, 'NOW')
                  );
                })
              ),
              React.createElement('div', {
                style: { display: 'flex', gap: 2, padding: '4px 0 0', fontFamily: Fm, fontSize: 9.5, color: C.t4 }
              },
                hodHours.map(function (h) {
                  return React.createElement('div', { key: h, style: { flex: 1, textAlign: 'center' } },
                    (h % 4 === 0 || h === 23)
                      ? (h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p')
                      : ''
                  );
                })
              ),
              React.createElement('div', {
                style: { display: 'flex', gap: 14, fontSize: 11, color: C.t3, marginTop: 8, justifyContent: 'flex-end' }
              },
                React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5 } },
                  React.createElement('i', { style: { width: 10, height: 10, background: C.green, borderRadius: 2, display: 'inline-block' } }),
                  'Working'
                ),
                React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5 } },
                  React.createElement('i', { style: { width: 10, height: 10, background: C.blue, borderRadius: 2, display: 'inline-block' } }),
                  'On break'
                )
              )
            )
          ),

          // Live Status Board (kanban)
          panel('Live Status Board', null,
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 } },
              renderStatusColumn(C, 'Working', C.green, fClockedIn.length, fClockedIn.slice(0, 30).map(function (e) {
                var ep = punches.filter(function (p) { return p.eid === e.id && p.type === 'in'; })
                  .sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
                var inT = ep[0] ? new Date(ep[0].time) : null;
                var elapsed = inT ? ((Date.now() - inT) / 3600000).toFixed(1) + 'h' : '';
                return personCard(e, elapsed, C.t3);
              })),
              renderStatusColumn(C, 'On Break', C.blue, fOnBreak.length, fOnBreak.map(function (e) {
                return personCard(e, '', C.blue);
              })),
              renderStatusColumn(C, 'Late / Issue', C.amber, late.length, late.slice(0, 30).map(function (x) {
                var e = employees.find(function (emp) { return emp.id === (x.eid || x.id); }) || { id: x.eid || x.id, fn: x.fn || '?', ln: x.ln || '', badge: x.badge || '—' };
                return personCard(e, x.label || x.type || 'late', C.amber);
              })),
              renderStatusColumn(C, 'No-Show', C.red, noShowToday.length, noShowToday.slice(0, 30).map(function (e) {
                return personCard(e, 'scheduled', C.red);
              }))
            )
          ),

          // Department Breakdown
          panel('By Department', null,
            React.createElement('div', null,
              deptList.length === 0
                ? React.createElement('div', { style: { color: C.t4, fontSize: 12, padding: '8px 0' } }, 'No departments to show')
                : deptList.map(function (d) {
                    var data = deptMap[d];
                    var pctW = data.total > 0 ? (data.working / data.total * 100) : 0;
                    var pctB = data.total > 0 ? (data.brk / data.total * 100) : 0;
                    var pctO = data.total > 0 ? (data.off / data.total * 100) : 0;
                    return React.createElement('div', {
                      key: d,
                      style: { display: 'grid', gridTemplateColumns: '140px 1fr 70px', gap: 10, alignItems: 'center', padding: '6px 0' }
                    },
                      React.createElement('div', { style: { fontSize: 12, fontWeight: 600, color: C.t1 } }, d),
                      React.createElement('div', { style: { height: 14, borderRadius: 3, background: C.srf2, overflow: 'hidden', display: 'flex' } },
                        React.createElement('div', { style: { width: pctW + '%', background: C.green } }),
                        React.createElement('div', { style: { width: pctB + '%', background: C.blue } }),
                        React.createElement('div', { style: { width: pctO + '%', background: C.t4, opacity: 0.3 } })
                      ),
                      React.createElement('div', { style: { fontFamily: Fm, fontSize: 11.5, color: C.t3, textAlign: 'right' } },
                        React.createElement('b', { style: { color: C.t1 } }, data.working + data.brk),
                        '/', data.total
                      )
                    );
                  })
            )
          )
        ),

        // RIGHT COLUMN
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },

          // Live Alerts
          panel('Live Alerts', liveAlerts.length + ' open',
            React.createElement('div', { style: { maxHeight: 380, overflowY: 'auto' } },
              liveAlerts.length === 0
                ? React.createElement('div', { style: { color: C.green, fontSize: 12, padding: '10px 0', textAlign: 'center' } }, '✓ No active alerts')
                : liveAlerts.map(function (a, i) {
                    var sev = ((a.severity || a.level || 'info') + '').toLowerCase();
                    var color = (sev === 'critical' || sev === 'red') ? C.red
                              : (sev === 'warn' || sev === 'warning' || sev === 'amber') ? C.amber
                              : (sev === 'info' || sev === 'blue') ? C.blue
                              : C.t3;
                    var label  = a.label || a.title || a.type || 'Alert';
                    var detail = a.detail || a.message || a.desc || '';
                    var when   = a.time || a.created_at || a.at;
                    var ago    = when ? timeAgo(when) : '';
                    return React.createElement('div', {
                      key: a.id || i,
                      onClick: function () { if (a.eid) onOpenEmp(a.eid); },
                      style: { display: 'grid', gridTemplateColumns: '3px 1fr auto', gap: 10, padding: '10px 0', borderBottom: '1px solid ' + C.bds, cursor: a.eid ? 'pointer' : 'default' }
                    },
                      React.createElement('div', { style: { width: 3, borderRadius: 2, background: color } }),
                      React.createElement('div', null,
                        React.createElement('div', { style: { fontSize: 12.5, fontWeight: 600 } }, label),
                        detail && React.createElement('div', { style: { fontFamily: Fm, fontSize: 11, color: C.t3, marginTop: 2 } }, detail)
                      ),
                      React.createElement('div', { style: { fontFamily: Fm, fontSize: 10.5, color: C.t4, whiteSpace: 'nowrap' } }, ago)
                    );
                  })
            )
          ),

          // Labor Cost Gauge
          panel('Labor Cost · ' + (weekOffset === 0 ? 'this week' : 'selected week'), null,
            React.createElement('div', null,
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '4px 0' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.8, color: C.t4, fontWeight: 600 } }, 'Spent'),
                  React.createElement('div', { style: { fontFamily: Fm, fontSize: 22, fontWeight: 700, color: C.spark, margin: '4px 0' } }, '$' + Math.round(totalLabor).toLocaleString()),
                  React.createElement('div', { style: { height: 8, borderRadius: 4, background: C.srf2, overflow: 'hidden', marginTop: 6 } },
                    React.createElement('div', { style: { height: '100%', width: laborPct ? Math.min(100, laborPct) + '%' : '100%', background: 'linear-gradient(90deg, ' + C.green + ', ' + C.spark + ' 70%, ' + C.red + ')' } })
                  ),
                  React.createElement('div', { style: { fontFamily: Fm, fontSize: 11, marginTop: 4, color: laborPct === null ? C.t4 : laborPct > 100 ? C.red : laborPct > 80 ? C.amber : C.green } },
                    laborPct === null ? 'No budget set' : laborPct + '% of budget'
                  )
                ),
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.8, color: C.t4, fontWeight: 600 } }, 'Active workers'),
                  React.createElement('div', { style: { fontFamily: Fm, fontSize: 22, fontWeight: 700, color: C.t1, margin: '4px 0' } }, fActive.length),
                  React.createElement('div', { style: { fontSize: 11.5, color: C.t3, marginTop: 8 } },
                    fActive.length > 0 ? 'Avg $/active: ' + Math.round(totalLabor / fActive.length).toLocaleString() : '—'
                  )
                )
              ),
              React.createElement('div', { style: { borderTop: '1px solid ' + C.bds, marginTop: 14, paddingTop: 14, fontSize: 11.5, color: C.t3, display: 'flex', justifyContent: 'space-between' } },
                React.createElement('span', null, 'OT hours: ', React.createElement('b', { style: { color: C.amber, fontFamily: Fm } }, otCount)),
                React.createElement('span', null, 'At risk: ', React.createElement('b', { style: { color: C.amber, fontFamily: Fm } }, atRisk.length))
              )
            )
          ),

          // Action Queue
          panel('Action Queue', (allExcs.length + futurePunches.length + pending.length) + ' open',
            React.createElement('div', null,
              futurePunches.length > 0 && actionRow(C, C.red, futurePunches.length + ' future-dated punch(es)', 'data integrity issue — review on profile', function () {
                if (futurePunches[0].eid) onOpenEmp(futurePunches[0].eid);
              }),
              pending.length > 0 && actionRow(C, C.amber, pending.length + ' missing-punch request(s)', 'awaiting approval', function () {
                onSwitchTab('approvals');
              }),
              allExcs.length > 0 && actionRow(C, C.amber, allExcs.length + ' attendance exception(s)', 'review and approve or dismiss', function () {
                onSwitchTab('alerts');
              }),
              (futurePunches.length === 0 && pending.length === 0 && allExcs.length === 0) &&
                React.createElement('div', { style: { color: C.green, fontSize: 12, padding: '10px 0', textAlign: 'center' } }, '✓ Nothing in the queue')
            )
          )
        )
      )
    );
  }

  // ── helper: render one column of the kanban ─────────────────
  function renderStatusColumn(C, label, color, count, cards) {
    return React.createElement('div', {
      style: { background: C.srf2, border: '1px solid ' + C.bd, borderRadius: 8, overflow: 'hidden' }
    },
      React.createElement('div', {
        style: { padding: '8px 12px', borderBottom: '1px solid ' + C.bd, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
      },
        React.createElement('div', {
          style: { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 6 }
        },
          React.createElement('span', {
            style: { width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: label === 'Working' ? '0 0 6px ' + color : 'none', display: 'inline-block' }
          }),
          label
        ),
        React.createElement('span', {
          style: { fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: color }
        }, count)
      ),
      React.createElement('div', {
        style: { padding: 6, maxHeight: 320, overflowY: 'auto' }
      }, cards)
    );
  }

  // ── helper: render one row of the action queue ──────────────
  function actionRow(C, color, title, detail, onClick) {
    return React.createElement('div', {
      onClick: onClick,
      style: { display: 'grid', gridTemplateColumns: '3px 1fr auto', gap: 10, padding: '10px 0', borderBottom: '1px solid ' + C.bds, cursor: 'pointer' }
    },
      React.createElement('div', { style: { background: color, borderRadius: 2 } }),
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: 12.5, fontWeight: 600 } }, title),
        React.createElement('div', { style: { fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.t3, marginTop: 2 } }, detail)
      ),
      React.createElement('button', {
        onClick: function (ev) { ev.stopPropagation(); onClick(); },
        style: { padding: '5px 11px', background: C.spark, color: C.bg, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer' }
      }, 'Open')
    );
  }

  // Expose globally
  window.CommandCenter = CommandCenter;
})();
