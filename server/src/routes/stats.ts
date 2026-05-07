import { Hono } from "hono";
import { query } from "../db.js";
import { snapshot } from "../stats.js";

export const statsRoutes = new Hono();

statsRoutes.get("/data", async (c) => {
    const snap = snapshot();
    let db: Record<string, number | string> = {};
    try {
        const r = await query<{ k: string; n: number }>(`
            select 'bus_locations_active' as k,
                   count(*)::int as n
              from bondi.bus_locations
             where last_seen_at > now() - interval '90 seconds'
            union all
            select 'bus_locations_total', count(*)::int from bondi.bus_locations
            union all
            select 'favoritos', count(*)::int from bondi.favoritos
            union all
            select 'rutinas', count(*)::int from bondi.rutinas
            union all
            select 'subscriptions', count(*)::int from bondi.subscriptions
        `);
        db = Object.fromEntries(r.rows.map((row) => [row.k, row.n]));
    } catch (e) {
        db = { error: (e as Error).message };
    }
    return c.json({ ...snap, db });
});

const HTML = /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>bondi-api · stats</title>
<style>
  :root {
    --bg: #0c0d10;
    --surface: #16181d;
    --surface-2: #1f2229;
    --border: #2a2e37;
    --text: #e7e9ee;
    --muted: #8a8f99;
    --accent: #84cc16;
    --green: #22c55e;
    --yellow: #eab308;
    --red: #ef4444;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font: 14px/1.5 ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace;
    padding: 24px;
    min-height: 100vh;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
  }
  h1 {
    font-size: 18px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0;
    color: var(--muted);
    font-weight: 500;
  }
  h1 strong { color: var(--text); font-weight: 600; }
  .updated { color: var(--muted); font-size: 12px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
  }
  .card h2 {
    margin: 0 0 12px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    font-weight: 600;
  }
  .row { display: flex; justify-content: space-between; align-items: center; margin: 6px 0; }
  .row .k { color: var(--muted); }
  .row .v { font-variant-numeric: tabular-nums; }
  .big { font-size: 28px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .pill .dot { width: 8px; height: 8px; border-radius: 50%; }
  .pill.ok { background: rgba(34,197,94,0.12); color: var(--green); }
  .pill.ok .dot { background: var(--green); box-shadow: 0 0 8px var(--green); }
  .pill.warn { background: rgba(234,179,8,0.12); color: var(--yellow); }
  .pill.warn .dot { background: var(--yellow); }
  .pill.bad { background: rgba(239,68,68,0.14); color: var(--red); }
  .pill.bad .dot { background: var(--red); box-shadow: 0 0 8px var(--red); }
  .health {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .health .card { display: flex; flex-direction: column; gap: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table td, table th { padding: 6px 8px; border-bottom: 1px solid var(--border); text-align: left; }
  table th { color: var(--muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  table td.r { text-align: right; font-variant-numeric: tabular-nums; }
  .status-200 { color: var(--green); }
  .status-3xx { color: #38bdf8; }
  .status-4xx { color: var(--yellow); }
  .status-5xx { color: var(--red); }
  .muted { color: var(--muted); }
  .scroll { max-height: 280px; overflow-y: auto; }
  .scroll::-webkit-scrollbar { width: 6px; }
  .scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .err-row td { font-family: inherit; }
  .err-row td:first-child { color: var(--muted); white-space: nowrap; }
  .footer { color: var(--muted); font-size: 11px; margin-top: 24px; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>bondi-api · <strong>stats</strong></h1>
  <div class="updated"><span id="updated">cargando…</span> · auto-refresh 5s</div>
</header>

<div class="health">
  <div class="card">
    <h2>aeterna server</h2>
    <div id="aeterna-pill" class="pill ok"><span class="dot"></span> esperando…</div>
    <div class="row"><span class="k">uptime</span><span class="v" id="uptime">–</span></div>
    <div class="row"><span class="k">memoria heap</span><span class="v" id="mem">–</span></div>
  </div>
  <div class="card">
    <h2>MGP municipalidad</h2>
    <div id="mgp-pill" class="pill ok"><span class="dot"></span> esperando…</div>
    <div class="row"><span class="k">última respuesta ok</span><span class="v" id="mgp-last-ok">–</span></div>
    <div class="row"><span class="k">último 429</span><span class="v" id="mgp-last-429">–</span></div>
  </div>
</div>

<div class="grid">
  <div class="card">
    <h2>requests</h2>
    <div class="big" id="req-total">0</div>
    <div class="muted" style="font-size:12px;margin:4px 0 12px">desde último restart</div>
    <div class="row"><span class="k">último 1 min</span><span class="v" id="req-1m">0</span></div>
    <div class="row"><span class="k">últimos 5 min</span><span class="v" id="req-5m">0</span></div>
    <div class="row"><span class="k">últimos 15 min</span><span class="v" id="req-15m">0</span></div>
  </div>

  <div class="card">
    <h2>cache shim POST /</h2>
    <div class="row"><span class="k">hits frescos</span><span class="v" id="c-hit">0</span></div>
    <div class="row"><span class="k">miss (full MGP call)</span><span class="v" id="c-miss">0</span></div>
    <div class="row"><span class="k">stale-while-error</span><span class="v" id="c-stale">0</span></div>
    <div class="row"><span class="k">hit ratio</span><span class="v" id="c-ratio">–</span></div>
  </div>

  <div class="card">
    <h2>MGP calls</h2>
    <div class="row"><span class="k">total</span><span class="v" id="m-total">0</span></div>
    <div class="row"><span class="k">ok</span><span class="v" id="m-ok" style="color:var(--green)">0</span></div>
    <div class="row"><span class="k">429 rate-limit</span><span class="v" id="m-429" style="color:var(--yellow)">0</span></div>
    <div class="row"><span class="k">otros errores</span><span class="v" id="m-err" style="color:var(--red)">0</span></div>
  </div>

  <div class="card">
    <h2>db (postgres)</h2>
    <div class="row"><span class="k">bondis activos (GPS)</span><span class="v" id="db-buses-active">–</span></div>
    <div class="row"><span class="k">sesiones GPS totales</span><span class="v" id="db-buses-total">–</span></div>
    <div class="row"><span class="k">favoritos</span><span class="v" id="db-favs">–</span></div>
    <div class="row"><span class="k">rutinas</span><span class="v" id="db-rut">–</span></div>
    <div class="row"><span class="k">push subs</span><span class="v" id="db-subs">–</span></div>
  </div>
</div>

<div class="grid" style="margin-top:16px">
  <div class="card">
    <h2>top endpoints</h2>
    <table id="top-paths"><tbody></tbody></table>
  </div>
  <div class="card">
    <h2>top acciones (POST /)</h2>
    <table id="top-acciones"><tbody></tbody></table>
  </div>
  <div class="card">
    <h2>status codes</h2>
    <table id="by-status"><tbody></tbody></table>
  </div>
</div>

<div class="card" style="margin-top:16px">
  <h2>últimas requests</h2>
  <div class="scroll">
    <table id="recent">
      <thead><tr><th>cuándo</th><th>req</th><th class="r">status</th><th class="r">ms</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<div class="card" style="margin-top:16px">
  <h2>últimos errores</h2>
  <div class="scroll">
    <table id="errors">
      <thead><tr><th>cuándo</th><th>req</th><th class="r">status</th><th>msg</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<div class="footer">bondi-api · refresh cada 5s · sin auth · ver /stats/data para JSON</div>

<script>
function fmtAge(ts) {
  if (!ts) return 'nunca';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s/60) + 'm';
  if (s < 86400) return Math.floor(s/3600) + 'h';
  return Math.floor(s/86400) + 'd';
}
function fmtUptime(sec) {
  const d = Math.floor(sec/86400), h = Math.floor((sec%86400)/3600), m = Math.floor((sec%3600)/60);
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm ' + (sec%60) + 's';
}
function fmtBytes(n) { return (n/1024/1024).toFixed(1) + ' MiB'; }
function setPill(id, status, label) {
  const el = document.getElementById(id);
  el.className = 'pill ' + status;
  el.innerHTML = '<span class="dot"></span> ' + label;
}
function statusClass(s) {
  if (s < 300) return 'status-200';
  if (s < 400) return 'status-3xx';
  if (s < 500) return 'status-4xx';
  return 'status-5xx';
}
function rowsTo(el, rows) {
  el.querySelector('tbody').innerHTML = rows.length
    ? rows.join('')
    : '<tr><td colspan="9" class="muted">sin data</td></tr>';
}

async function refresh() {
  try {
    const r = await fetch('/stats/data', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    document.getElementById('updated').textContent = new Date(d.now).toLocaleTimeString('es-AR');

    setPill('aeterna-pill', 'ok', '🟢 OK');
    document.getElementById('uptime').textContent = fmtUptime(d.uptimeSec);
    document.getElementById('mem').textContent = fmtBytes(d.memory.heapUsed) + ' / ' + fmtBytes(d.memory.heapTotal);

    const m = d.mgp;
    const lastOkAge = m.lastSuccessAt ? (Date.now() - m.lastSuccessAt) / 1000 : Infinity;
    const last429Age = m.last429At ? (Date.now() - m.last429At) / 1000 : Infinity;
    let mgpStatus, mgpLabel;
    if (m.total === 0) { mgpStatus = 'warn'; mgpLabel = '⚪ sin tráfico'; }
    else if (last429Age < 120) { mgpStatus = 'bad'; mgpLabel = '🔴 rate-limited'; }
    else if (lastOkAge < 60) { mgpStatus = 'ok'; mgpLabel = '🟢 OK'; }
    else if (lastOkAge < 300) { mgpStatus = 'warn'; mgpLabel = '🟡 algo lento'; }
    else { mgpStatus = 'bad'; mgpLabel = '🔴 sin respuesta reciente'; }
    setPill('mgp-pill', mgpStatus, mgpLabel);
    document.getElementById('mgp-last-ok').textContent = fmtAge(m.lastSuccessAt) + (m.lastSuccessAt ? ' atrás' : '');
    document.getElementById('mgp-last-429').textContent = fmtAge(m.last429At) + (m.last429At ? ' atrás' : '');

    document.getElementById('req-total').textContent = d.requests.total.toLocaleString('es-AR');
    document.getElementById('req-1m').textContent = d.requests.last1m.count + (d.requests.last1m.errors ? ' (' + d.requests.last1m.errors + ' err)' : '');
    document.getElementById('req-5m').textContent = d.requests.last5m.count + (d.requests.last5m.errors ? ' (' + d.requests.last5m.errors + ' err)' : '');
    document.getElementById('req-15m').textContent = d.requests.last15m.count + (d.requests.last15m.errors ? ' (' + d.requests.last15m.errors + ' err)' : '');

    document.getElementById('c-hit').textContent = d.cache.hit;
    document.getElementById('c-miss').textContent = d.cache.miss;
    document.getElementById('c-stale').textContent = d.cache.stale;
    const tot = d.cache.hit + d.cache.miss + d.cache.stale;
    document.getElementById('c-ratio').textContent = tot ? ((d.cache.hit / tot * 100).toFixed(0) + '%') : '–';

    document.getElementById('m-total').textContent = m.total;
    document.getElementById('m-ok').textContent = m.ok;
    document.getElementById('m-429').textContent = m.rateLimited;
    document.getElementById('m-err').textContent = m.otherErrors;

    const db = d.db || {};
    document.getElementById('db-buses-active').textContent = db.bus_locations_active ?? '–';
    document.getElementById('db-buses-total').textContent = db.bus_locations_total ?? '–';
    document.getElementById('db-favs').textContent = db.favoritos ?? '–';
    document.getElementById('db-rut').textContent = db.rutinas ?? '–';
    document.getElementById('db-subs').textContent = db.subscriptions ?? '–';

    rowsTo(document.getElementById('top-paths'),
      d.requests.topPaths.map(p => '<tr><td>' + p.key + '</td><td class="r">' + p.count + '</td></tr>'));
    rowsTo(document.getElementById('top-acciones'),
      d.requests.topAcciones.map(p => '<tr><td>' + p.key + '</td><td class="r">' + p.count + '</td></tr>'));
    rowsTo(document.getElementById('by-status'),
      Object.entries(d.requests.byStatus).sort((a,b)=>a[0]-b[0]).map(([s,n]) =>
        '<tr><td class="' + statusClass(+s) + '">' + s + '</td><td class="r">' + n + '</td></tr>'));

    rowsTo(document.getElementById('recent'),
      d.recentRequests.map(r => '<tr><td class="muted">' + fmtAge(r.at) + '</td><td>' + r.method + ' ' + r.path + '</td><td class="r ' + statusClass(r.status) + '">' + r.status + '</td><td class="r muted">' + r.durationMs + '</td></tr>'));
    rowsTo(document.getElementById('errors'),
      d.errors.map(e => '<tr class="err-row"><td>' + new Date(e.at).toLocaleTimeString('es-AR') + '</td><td>' + e.path + '</td><td class="r ' + statusClass(e.status) + '">' + e.status + '</td><td class="muted">' + (e.message || '') + '</td></tr>'));
  } catch (e) {
    setPill('aeterna-pill', 'bad', '🔴 sin respuesta');
    document.getElementById('updated').textContent = 'error: ' + e.message;
  }
}
refresh();
setInterval(refresh, 5000);
</script>
</body>
</html>`;

statsRoutes.get("/", (c) => {
    return c.html(HTML);
});
