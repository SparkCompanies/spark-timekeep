// Pre-deploy guard: refuse to publish anything that isn't a working TimeKeep page.
const fs = require("fs"), vm = require("vm");
const html = fs.readFileSync("index.html", "utf8");
const fail = (m) => { console.error("BLOCKED DEPLOY: " + m); process.exit(1); };
const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
if (title !== "Spark TimeKeep") fail("index.html is not TimeKeep (title is " + JSON.stringify(title) + ")");
for (const marker of ["function KioskView({", "function doExport(type)", "ReactDOM.createRoot("])
  if (!html.includes(marker)) fail("missing " + marker);
if (html.length < 300000 || html.length > 1500000) fail("unexpected size " + html.length);
const re = /<script(?![^>]*\bsrc=)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g;
let m, n = 0;
while ((m = re.exec(html))) { n++; try { new vm.Script(m[1], { filename: "inline-" + n + ".js" }); } catch (e) { fail("JS syntax error in inline script " + n + ": " + e.message); } }
for (const f of ["command-center.js", "punch-source-report.js"])
  if (fs.existsSync(f)) try { new vm.Script(fs.readFileSync(f, "utf8"), { filename: f }); } catch (e) { fail(f + ": " + e.message); }
console.log("OK: TimeKeep page checked (" + n + " inline scripts)");
