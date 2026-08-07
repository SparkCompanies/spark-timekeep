/* ═══════════════════════════════════════════════════════════════
   Spark TimeKeep — Punch Source Report
   Standalone component. Loaded via <script src> so index.html only
   gains one line and this file can be edited without touching it.
   Exposes: window.PunchSourceReport
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var e = React.createElement;

  var CO = {
    bg: "#0a0d12", panel: "#11151c", bd: "#1f2733", bd2: "#1a2029",
    t1: "#e8ecf2", t2: "#a9b3c1", t3: "#7f8a9b",
    gold: "#ffc233", green: "#22c55e", blue: "#38bdf8",
    orange: "#f59e0b", red: "#ef4444", purple: "#a78bfa"
  };

  /* Every punch resolves to exactly one bucket. */
  var SOURCES = [
    { k: "kiosk",    label: "Kiosk",           color: CO.green,  test: function (d) { return /^KIOSK/i.test(d); } },
    { k: "mobile",   label: "Mobile",          color: CO.blue,   test: function (d) { return /^MOBILE/i.test(d); } },
    { k: "exempt",   label: "Exempt Device",   color: CO.purple, test: function (d) { return /^EXEMPT/i.test(d); } },
    { k: "manager",  label: "Manager Entered", color: CO.orange, test: function (d) { return /^MANAGER/i.test(d); } },
    { k: "approved", label: "Approved Request",color: CO.gold,   test: function (d) { return /^APPROVED/i.test(d); } },
    { k: "unknown",  label: "Unknown",         color: CO.t3,     test: function () { return true; } }
  ];

  function classify(dev) {
    var d = String(dev || "");
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].test(d)) return SOURCES[i];
    return SOURCES[SOURCES.length - 1];
  }

  function ymd(dt) {
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
  }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return ymd(d); }
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    return (s.indexOf(",") > -1 || s.indexOf('"') > -1 || s.indexOf("\n") > -1)
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  var inp = {
    padding: "8px 12px", background: CO.bg, border: "1px solid " + CO.bd,
    color: CO.t1, borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit"
  };
  var th = {
    padding: "9px 12px", textAlign: "left", fontSize: 10.5, fontWeight: 700,
    color: CO.t3, textTransform: "uppercase", letterSpacing: 0.7,
    borderBottom: "1px solid " + CO.bd
  };
  var td = { padding: "9px 12px", fontSize: 12.5, borderBottom: "1px solid " + CO.bd2, color: CO.t2 };
  var mono = { fontFamily: "'IBM Plex Mono',monospace" };

  function PunchSourceReport(props) {
    var punches = props.punches || [];
    var emps = props.emps || [];

    var rFrom = React.useState(daysAgo(13)), from = rFrom[0], setFrom = rFrom[1];
    var rTo = React.useState(ymd(new Date())), to = rTo[0], setTo = rTo[1];
    var rSrc = React.useState("all"), srcFilter = rSrc[0], setSrcFilter = rSrc[1];
    var rQ = React.useState(""), q = rQ[0], setQ = rQ[1];
    var rTab = React.useState("summary"), view = rTab[0], setView = rTab[1];

    var em = {};
    emps.forEach(function (x) { em[x.id] = x; });

    var fromMs = new Date(from + "T00:00:00").getTime();
    var toMs = new Date(to + "T23:59:59.999").getTime();

    var rows = punches.filter(function (p) {
      var t = new Date(p.time).getTime();
      if (isNaN(t) || t < fromMs || t > toMs) return false;
      var s = classify(p.dev);
      if (srcFilter !== "all" && s.k !== srcFilter) return false;
      if (q) {
        var r = em[p.eid] || {};
        var hay = ((r.fn || "") + " " + (r.ln || "") + " " + (r.badge || "") + " " + (r.dept || "") + " " + (p.dev || "")).toLowerCase();
        if (hay.indexOf(q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return new Date(b.time) - new Date(a.time); });

    /* ── totals by source ── */
    var counts = {};
    SOURCES.forEach(function (s) { counts[s.k] = 0; });
    rows.forEach(function (p) { counts[classify(p.dev).k]++; });
    var totalN = rows.length || 1;

    /* ── per-device detail ── */
    var byDev = {};
    rows.forEach(function (p) {
      var d = p.dev || "(blank)";
      if (!byDev[d]) byDev[d] = { dev: d, n: 0, src: classify(p.dev), first: null, last: null };
      byDev[d].n++;
      var t = new Date(p.time);
      if (!byDev[d].first || t < byDev[d].first) byDev[d].first = t;
      if (!byDev[d].last || t > byDev[d].last) byDev[d].last = t;
    });
    var devList = Object.keys(byDev).map(function (k) { return byDev[k]; })
      .sort(function (a, b) { return b.n - a.n; });

    /* ── manager-entered detail ── */
    var manual = rows.filter(function (p) { return classify(p.dev).k === "manager" || classify(p.dev).k === "approved"; });

    /* ── per-employee manual rate ── */
    var byEmp = {};
    rows.forEach(function (p) {
      if (!byEmp[p.eid]) byEmp[p.eid] = { eid: p.eid, total: 0, man: 0, kiosk: 0, mob: 0 };
      var k = classify(p.dev).k;
      byEmp[p.eid].total++;
      if (k === "manager" || k === "approved") byEmp[p.eid].man++;
      if (k === "kiosk") byEmp[p.eid].kiosk++;
      if (k === "mobile") byEmp[p.eid].mob++;
    });
    var empRows = Object.keys(byEmp).map(function (k) {
      var x = byEmp[k], r = em[k] || {};
      return {
        name: (r.fn || "?") + " " + (r.ln || "?"), badge: r.badge || "", dept: r.dept || "",
        total: x.total, man: x.man, kiosk: x.kiosk, mob: x.mob,
        pct: x.total ? (x.man / x.total * 100) : 0
      };
    }).sort(function (a, b) { return b.pct - a.pct || b.man - a.man; });

    function exportCSV() {
      var head = ["Timestamp", "Employee", "Badge", "Dept", "Punch Type", "Source", "Device", "IP", "Edited", "Edited By", "Reason"];
      var lines = rows.map(function (p) {
        var r = em[p.eid] || {};
        return [
          new Date(p.time).toLocaleString(),
          (r.fn || "") + " " + (r.ln || ""), r.badge || "", r.dept || "",
          p.type, classify(p.dev).label, p.dev || "", p.ip || "",
          p.edited ? "YES" : "", p.editedBy || "", p.editReason || ""
        ].map(csvCell).join(",");
      });
      var blob = new Blob([head.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "punch-sources-" + from + "-to-" + to + ".csv";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function card(s) {
      var n = counts[s.k], pct = (n / totalN * 100);
      return e("div", { key: s.k, style: { padding: "14px 16px", background: CO.panel, border: "1px solid " + CO.bd, borderRadius: 10, borderTop: "2px solid " + s.color } },
        e("div", { style: { fontSize: 10, color: CO.t3, textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700, marginBottom: 6 } }, s.label),
        e("div", { style: Object.assign({ fontSize: 24, fontWeight: 700, color: s.color }, mono) }, n),
        e("div", { style: { fontSize: 11, color: CO.t2, marginTop: 2 } }, pct.toFixed(1) + "% of punches"),
        e("div", { style: { marginTop: 8, height: 4, background: CO.bd2, borderRadius: 2, overflow: "hidden" } },
          e("div", { style: { width: Math.min(100, pct) + "%", height: "100%", background: s.color } }))
      );
    }

    return e("div", { style: { color: CO.t1 } },

      e("div", { style: { marginBottom: 6, fontSize: 18, fontWeight: 800 } }, "Punch Source Report"),
      e("div", { style: { fontSize: 12.5, color: CO.t3, marginBottom: 16 } },
        "Where every punch came from \u2014 kiosk, mobile, or manager entry. Manager-entered punches show the reason and who recorded them."),

      /* filters */
      e("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16, padding: "12px 14px", background: CO.panel, border: "1px solid " + CO.bd, borderRadius: 10 } },
        e("input", { type: "date", value: from, onChange: function (ev) { setFrom(ev.target.value); }, style: inp }),
        e("span", { style: { color: CO.t3, fontSize: 12 } }, "to"),
        e("input", { type: "date", value: to, onChange: function (ev) { setTo(ev.target.value); }, style: inp }),
        e("select", { value: srcFilter, onChange: function (ev) { setSrcFilter(ev.target.value); }, style: inp },
          e("option", { value: "all" }, "All Sources"),
          SOURCES.map(function (s) { return e("option", { key: s.k, value: s.k }, s.label); })),
        e("input", { placeholder: "Search name, badge, dept, device...", value: q, onChange: function (ev) { setQ(ev.target.value); }, style: Object.assign({}, inp, { flex: "1 1 220px" }) }),
        [["7", 6], ["30", 29], ["90", 89]].map(function (b) {
          return e("button", { key: b[0], onClick: function () { setFrom(daysAgo(b[1])); setTo(ymd(new Date())); }, style: { padding: "8px 12px", background: "transparent", border: "1px solid " + CO.bd, color: CO.t2, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit" } }, b[0] + "d");
        }),
        e("button", { onClick: exportCSV, style: { padding: "8px 14px", background: CO.gold, border: "none", color: "#1a1300", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } }, "Export CSV (" + rows.length + ")")
      ),

      /* source cards */
      e("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 } },
        SOURCES.filter(function (s) { return counts[s.k] > 0 || s.k === "kiosk" || s.k === "mobile" || s.k === "manager"; }).map(card)),

      /* view tabs */
      e("div", { style: { display: "flex", gap: 4, borderBottom: "1px solid " + CO.bd, marginBottom: 16 } },
        [["summary", "By Device"], ["manual", "Manager Entries \u00b7 " + manual.length], ["employees", "By Employee"], ["log", "All Punches \u00b7 " + rows.length]].map(function (t) {
          var on = view === t[0];
          return e("button", { key: t[0], onClick: function () { setView(t[0]); }, style: { padding: "10px 16px", background: "transparent", border: "none", color: on ? CO.gold : CO.t2, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderBottom: "2px solid " + (on ? CO.gold : "transparent"), marginBottom: -1 } }, t[1]);
        })),

      /* ── BY DEVICE ── */
      view === "summary" && e("div", { style: { background: CO.panel, border: "1px solid " + CO.bd, borderRadius: 10, overflow: "hidden" } },
        e("table", { style: { width: "100%", borderCollapse: "collapse" } },
          e("thead", null, e("tr", null, ["Device", "Source", "Punches", "% of Total", "First Seen", "Last Seen"].map(function (x) { return e("th", { key: x, style: th }, x); }))),
          e("tbody", null, devList.length === 0
            ? e("tr", null, e("td", { style: Object.assign({}, td, { textAlign: "center", padding: 30 }), colSpan: 6 }, "No punches in this range"))
            : devList.map(function (d) {
                var stale = d.last && (Date.now() - d.last.getTime()) > 24 * 3600000 && d.src.k === "kiosk";
                return e("tr", { key: d.dev },
                  e("td", { style: Object.assign({}, td, mono, { color: CO.t1, fontWeight: 600 }) }, d.dev,
                    stale ? e("span", { style: { marginLeft: 8, padding: "2px 7px", background: CO.red + "22", color: CO.red, borderRadius: 3, fontSize: 9.5, fontWeight: 700 } }, "SILENT >24H") : null),
                  e("td", { style: td }, e("span", { style: { padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: d.src.color + "1a", color: d.src.color } }, d.src.label)),
                  e("td", { style: Object.assign({}, td, mono, { color: CO.t1, fontWeight: 700 }) }, d.n),
                  e("td", { style: Object.assign({}, td, mono) }, (d.n / totalN * 100).toFixed(1) + "%"),
                  e("td", { style: Object.assign({}, td, mono, { fontSize: 11 }) }, d.first ? d.first.toLocaleString() : ""),
                  e("td", { style: Object.assign({}, td, mono, { fontSize: 11 }) }, d.last ? d.last.toLocaleString() : "")
                );
              }))
        )),

      /* ── MANAGER ENTRIES ── */
      view === "manual" && e("div", { style: { background: CO.panel, border: "1px solid " + CO.bd, borderRadius: 10, overflow: "hidden" } },
        e("table", { style: { width: "100%", borderCollapse: "collapse" } },
          e("thead", null, e("tr", null, ["Punch Time", "Employee", "Type", "Entered Via", "Recorded By", "Reason"].map(function (x) { return e("th", { key: x, style: th }, x); }))),
          e("tbody", null, manual.length === 0
            ? e("tr", null, e("td", { style: Object.assign({}, td, { textAlign: "center", padding: 30 }), colSpan: 6 }, "No manager-entered punches in this range"))
            : manual.map(function (p) {
                var r = em[p.eid] || {};
                var who = p.editedBy || (String(p.dev || "").indexOf(" - ") > -1 ? String(p.dev).split(" - ").slice(1).join(" - ") : "");
                return e("tr", { key: p.id },
                  e("td", { style: Object.assign({}, td, mono, { color: CO.t1 }) }, new Date(p.time).toLocaleString()),
                  e("td", { style: td }, (r.fn || "?") + " " + (r.ln || "?"),
                    e("div", { style: Object.assign({ fontSize: 10.5, color: CO.t3 }, mono) }, (r.badge || "") + (r.dept ? " \u00b7 " + r.dept : ""))),
                  e("td", { style: td }, e("span", { style: { padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: (p.type === "in" ? CO.green : p.type === "out" ? CO.red : CO.blue) + "1a", color: p.type === "in" ? CO.green : p.type === "out" ? CO.red : CO.blue } }, String(p.type || "").toUpperCase())),
                  e("td", { style: Object.assign({}, td, mono, { fontSize: 11 }) }, p.dev || ""),
                  e("td", { style: Object.assign({}, td, { color: who ? CO.t1 : CO.red, fontWeight: who ? 600 : 700 }) }, who || "NOT RECORDED"),
                  e("td", { style: Object.assign({}, td, { fontSize: 11.5, color: p.editReason ? CO.t2 : CO.red }) }, p.editReason || "\u2014 no reason given")
                );
              }))
        )),

      /* ── BY EMPLOYEE ── */
      view === "employees" && e("div", { style: { background: CO.panel, border: "1px solid " + CO.bd, borderRadius: 10, overflow: "hidden" } },
        e("div", { style: { padding: "10px 14px", fontSize: 11.5, color: CO.t3, borderBottom: "1px solid " + CO.bd2 } },
          "Sorted by share of manager-entered punches. A high rate means this person's hours rest on someone else's data entry rather than their own punches."),
        e("table", { style: { width: "100%", borderCollapse: "collapse" } },
          e("thead", null, e("tr", null, ["Employee", "Badge", "Dept", "Total", "Kiosk", "Mobile", "Manager", "% Manager"].map(function (x) { return e("th", { key: x, style: th }, x); }))),
          e("tbody", null, empRows.length === 0
            ? e("tr", null, e("td", { style: Object.assign({}, td, { textAlign: "center", padding: 30 }), colSpan: 8 }, "No punches in this range"))
            : empRows.map(function (r, i) {
                var hot = r.pct >= 40 ? CO.red : r.pct >= 15 ? CO.orange : CO.t2;
                return e("tr", { key: i },
                  e("td", { style: Object.assign({}, td, { color: CO.t1, fontWeight: 600 }) }, r.name),
                  e("td", { style: Object.assign({}, td, mono, { fontSize: 11.5 }) }, r.badge),
                  e("td", { style: td }, r.dept),
                  e("td", { style: Object.assign({}, td, mono, { color: CO.t1 }) }, r.total),
                  e("td", { style: Object.assign({}, td, mono, { color: CO.green }) }, r.kiosk || "\u2014"),
                  e("td", { style: Object.assign({}, td, mono, { color: CO.blue }) }, r.mob || "\u2014"),
                  e("td", { style: Object.assign({}, td, mono, { color: r.man ? CO.orange : CO.t3 }) }, r.man || "\u2014"),
                  e("td", { style: Object.assign({}, td, mono, { color: hot, fontWeight: 700 }) }, r.pct.toFixed(0) + "%")
                );
              }))
        )),

      /* ── FULL LOG ── */
      view === "log" && e("div", { style: { background: CO.panel, border: "1px solid " + CO.bd, borderRadius: 10, overflow: "hidden" } },
        e("div", { style: { maxHeight: 620, overflowY: "auto" } },
          e("table", { style: { width: "100%", borderCollapse: "collapse" } },
            e("thead", null, e("tr", null, ["Time", "Employee", "Type", "Source", "Device", "IP"].map(function (x) { return e("th", { key: x, style: Object.assign({}, th, { position: "sticky", top: 0, background: "#0d1117", zIndex: 1 }) }, x); }))),
            e("tbody", null, rows.slice(0, 500).map(function (p) {
              var r = em[p.eid] || {}, s = classify(p.dev);
              return e("tr", { key: p.id },
                e("td", { style: Object.assign({}, td, mono, { fontSize: 11.5, color: CO.t1 }) }, new Date(p.time).toLocaleString(),
                  p.edited ? e("span", { style: { marginLeft: 6, color: CO.gold, fontSize: 10 } }, "\u2731 edited") : null),
                e("td", { style: td }, (r.fn || "?") + " " + (r.ln || "?")),
                e("td", { style: Object.assign({}, td, { fontSize: 11 }) }, String(p.type || "").toUpperCase()),
                e("td", { style: td }, e("span", { style: { padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, background: s.color + "1a", color: s.color } }, s.label)),
                e("td", { style: Object.assign({}, td, mono, { fontSize: 11 }) }, p.dev || ""),
                e("td", { style: Object.assign({}, td, mono, { fontSize: 11, color: CO.t3 }) }, p.ip || "")
              );
            }))
          )),
        rows.length > 500 && e("div", { style: { padding: "10px 14px", fontSize: 11.5, color: CO.t3, borderTop: "1px solid " + CO.bd2 } },
          "Showing 500 of " + rows.length + " \u2014 narrow the date range or export CSV for the full set."))
    );
  }

  window.PunchSourceReport = PunchSourceReport;
})();
