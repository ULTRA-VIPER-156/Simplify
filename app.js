/* ============================================================
   Stats for Spotify — unified app.js
   Sections:
   1.  Boot CSS injection (scrollbars + hero-mode styles)
   2.  Constants & utils
   3.  SVG icons
   4.  IndexedDB + state + config
   5.  Auth + API
   6.  Data (import, aggregate, compute)
   7.  Render helpers
   8.  Renderers (wrapped / now / top / stats / profile / settings / wrap / search / library)
   9.  Artist modal (small) + Artist HERO (new, scroll slides)
   10. Player bar
   11. Init
   ============================================================ */

/* ---------- 1. Boot CSS injection ---------- */
(() => {
  const s = document.createElement("style");
  s.textContent = `
    *{scrollbar-width:none}
    *::-webkit-scrollbar{display:none;width:0;height:0}

    /* toggleable artist cards */
    .wrapped-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.4rem;margin-bottom:2rem}
    .wrapped-card{position:relative;border-radius:24px;padding:1.8rem;color:#fff;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 40px rgba(0,0,0,.2);cursor:pointer;transition:transform .35s ease,box-shadow .35s ease;will-change:transform}
    .wrapped-card:hover{transform:translateY(-8px) scale(1.015);box-shadow:0 30px 60px rgba(0,0,0,.3)}
    .wrapped-card:hover .wc-expand{opacity:1;transform:translateY(0)}
    .wc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.3rem}
    .wc-brand{display:flex;align-items:center;gap:.5rem;font-weight:700;font-size:1rem}
    .wc-brand .ico{width:20px;height:20px}
    .wc-expand{opacity:0;transform:translateY(-4px);transition:all .3s ease;width:1.2rem;height:1.2rem;display:grid;place-items:center}
    .wc-expand .ico{width:100%;height:100%}
    .wc-label{font-size:.8rem;font-weight:700;letter-spacing:1.2px;margin-bottom:.5rem;text-transform:uppercase;opacity:.9}
    .wc-img{width:100%;aspect-ratio:1;border-radius:16px;overflow:hidden;margin-bottom:1.2rem;background:rgba(0,0,0,.25);box-shadow:0 10px 20px rgba(0,0,0,.2)}
    .wc-img img{width:100%;height:100%;object-fit:cover;display:block}
    .wc-name{font-size:2.4rem;font-weight:900;line-height:1;margin-bottom:.7rem;letter-spacing:-.02em;word-break:break-word}
    .wc-desc{font-size:.95rem;line-height:1.4;font-weight:500;margin-top:auto;opacity:.9}

    /* === artist HERO overlay === */
    .ahx{position:fixed;inset:0;z-index:90;color:#fff}
    .ahx-bg{position:absolute;inset:0;background:#000;transition:background-color .7s ease;overflow:hidden}
    .ahx-art{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;opacity:0;filter:blur(36px) saturate(160%);transform:scale(1.08);transition:opacity .9s ease,transform 6s ease;will-change:opacity,transform}
    .ahx-art.on{opacity:.85;transform:scale(1.18)}
    .ahx-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(145deg,rgba(0,0,0,.24),rgba(0,0,0,.48))}
    .ahd{position:absolute;inset:0;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none}
    .ahd::-webkit-scrollbar{display:none}
    .ahs{height:100vh;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;gap:3vw;padding:3vh 4vw}
    .ahc{height:min(86vh,calc(44vw*16/9));aspect-ratio:9/16;flex:none;will-change:transform}
    .ahp{width:min(560px,46vw);max-height:86vh;overflow:auto;padding:1.6rem;border-radius:28px;background:rgba(255,255,255,.14);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 20px 60px rgba(0,0,0,.25);scrollbar-width:none}
    .ahp::-webkit-scrollbar{display:none}
    .ahp-title{font-size:2.2rem;font-weight:800;letter-spacing:-.03em;line-height:1.05;margin-bottom:1rem;word-break:break-word}
    .ahp h5{font-size:.78rem;text-transform:uppercase;letter-spacing:.09em;opacity:.7;margin:1.2rem 0 .5rem}
    .ahp-chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem}
    .ahp-chip{background:rgba(255,255,255,.14);border-radius:16px;padding:.8rem .9rem;display:grid;gap:.15rem}
    .ahp-chip b{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
    .ahp-chip span{font-size:.78rem;opacity:.75}
    .ahp-bars{display:flex;align-items:flex-end;gap:3px;height:90px}
    .ahp-bars i{flex:1;height:0%;min-height:2px;background:rgba(255,255,255,.45);border-radius:4px 4px 0 0;transition:height .9s cubic-bezier(.2,.8,.2,1)}
    .ahp-bars i.hi{background:#fff}
    .ahp-lbl{display:flex;justify-content:space-between;font-size:.7rem;opacity:.7;margin-top:.3rem}
    .ahp-row{display:flex;gap:.8rem;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.15)}
    .ahp-row>b{width:1.4rem;opacity:.6;text-align:right}
    .ahp-row>div{flex:1;min-width:0;display:grid}
    .ahp-row em{font-style:normal;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ahp-row small{opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ahp-row>span{font-size:.85rem;opacity:.85;white-space:nowrap}
    .ahp-hbar{height:5px;border-radius:5px;background:rgba(255,255,255,.18);margin-top:.35rem;overflow:hidden}
    .ahp-hbar i{display:block;height:100%;width:0%;background:#fff;border-radius:5px;transition:width 1s cubic-bezier(.2,.8,.2,1)}
    .ahp-avatar{width:84px;height:84px;border-radius:50%;object-fit:cover;margin-bottom:1rem;display:block}
    .ahdots{position:fixed;right:1.1rem;top:50%;transform:translateY(-50%);display:grid;gap:.6rem;z-index:5}
    .ahdots button{width:10px;height:10px;border-radius:50%;background:#fff;opacity:.4;transition:transform .3s,opacity .3s}
    .ahdots button.on{transform:scale(1.8);opacity:1}
    .ahx-close{position:fixed;top:1rem;right:1rem;z-index:6;width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,.35);backdrop-filter:blur(10px);color:#fff;display:grid;place-items:center;cursor:pointer}
    .ahx-close .ico{width:18px;height:18px}
    .ahhint{position:fixed;bottom:1.2rem;left:50%;transform:translateX(-50%);z-index:5;font-weight:600;opacity:.75;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}
    @media(max-width:900px){
      .ahd{scroll-snap-type:y proximity}
      .ahs{height:auto;min-height:100vh;flex-direction:column;padding:6vh 4vw}
      .ahc{height:72vh}
      .ahp{width:100%;max-height:none}
    }
  `;
  document.head.appendChild(s);
})();

/* ---------- 2. Constants & utils ---------- */
const CLIENT_ID = "f4f91d34cbbd45408da8232678865b15";
const REDIRECT = "http://127.0.0.1:5173/";
const SCOPES = "user-read-currently-playing user-read-playback-state user-read-recently-played user-top-read user-modify-playback-state user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-private user-follow-read";
const DAY = 864e5;
const RANGES = { "4w": ["4 weeks", 28 * DAY, "short_term"], "6m": ["6 months", 182 * DAY, "medium_term"], "1y": ["1 year", 365 * DAY, "long_term"], all: ["Lifetime", Infinity, "long_term"] };
const SWATCHES = ["#ff8800", "#ff375f", "#bf5af2", "#0a84ff", "#30d158", "#ffd60a", "#64d2ff", "#ff6482"];
const CARD_COLORS = [["#1DB954","#15823b"],["#FF4B72","#c42a4f"],["#E63946","#b3242f"],["#8E44AD","#662d82"],["#F4D03F","#a58a1e"],["#0a84ff","#0055c9"]];

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtNum = (n) => n.toLocaleString();
const fmtDur = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`; };
const fmtClock = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const ago = (ts) => { const d = Date.now() - ts; if (d < 6e4) return "just now"; if (d < 36e5) return `${Math.floor(d / 6e4)} min ago`; if (d < DAY) return `${Math.floor(d / 36e5)} hr ago`; return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rand = (n) => b64(crypto.getRandomValues(new Uint8Array(n)));
const trackMeta = (t) => ({ n: t.name, a: t.artists[0]?.name || "Unknown", al: t.album?.name || "", img: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "" });
const dkey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dn = (k) => { const [y,m,d] = k.split("-"); return Date.UTC(y, m-1, d) / DAY; };
const dlabel = (k) => new Date(dn(k)*DAY).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const fd = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/* ---------- 3. SVG icons ---------- */
const ICONS = {
  play:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>`,
  next:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>`,
  prev:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 18l-8.5-6L18 6v12zM6 6h2v12H6z"/></svg>`,
  shuffle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`,
  repeat:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  heart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
  heartFill:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
  volume:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19 12a7 7 0 0 1-3 5.7"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>`,
  queue:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h13M3 12h13M3 18h13M20 6v12"/></svg>`,
  device:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  close:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  sun:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  fire:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2c2 4 6 5 6 11a6 6 0 1 1-12 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4 2-7 2-10z"/></svg>`,
  bolt:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>`,
  crown:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7l4 4 5-6 5 6 4-4v10H3z"/></svg>`,
  calendar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  globe:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>`,
  compass:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z"/></svg>`,
  headphones:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  trophy:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v5a6 6 0 0 1-12 0z"/><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3"/><path d="M12 15v5M8 20h8"/></svg>`,
  hourglass:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12"/><path d="M6 2v4a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2M6 22v-4a6 6 0 0 1 6-6 6 6 0 0 1 6 6v4"/></svg>`,
  expand:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
  spotify:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.455 17.338c-.218.363-.686.478-1.05.26-2.908-1.777-6.573-2.178-10.882-1.194-.415.096-.83-.166-.925-.58-.096-.416.166-.83.58-.926 4.71-1.077 8.753-.623 11.98 1.34.365.218.48.686.263 1.05zm1.456-3.24c-.273.444-.854.586-1.297.31-3.326-2.044-8.395-2.634-12.32-1.445-.496.15-1.023-.135-1.173-.63-.15-.497.136-1.024.632-1.173 4.48-1.358 10.067-.704 13.85 1.64.444.272.586.853.313 1.298zm.125-3.38C15.1 8.378 8.5 8.156 4.93 9.24c-.584.176-1.196-.153-1.374-.736-.176-.584.153-1.196.736-1.374 4.15-1.26 11.465-1.012 15.91 1.625.526.312.7 1.003.388 1.53-.313.525-1.003.7-1.53.387z"/></svg>`,
};
const icon = (name, cls = "") => `<span class="ico${cls ? " " + cls : ""}">${ICONS[name] || ""}</span>`;

/* ---------- 4. IndexedDB + state + config ---------- */
const idb = (() => {
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open("spotify-stats", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return {
    async get(k) { const db = await open(); return new Promise((res) => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); },
    async set(k, v) { const db = await open(); return new Promise((res) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = res; }); },
    async del(k) { const db = await open(); return new Promise((res) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").delete(k); t.oncomplete = res; }); }
  };
})();

let lib = { plays: [], meta: {}, art: {} };
let seen = new Map();
let saveTimer;
let tab = "wrapped";
let range = "all";
let metric = "plays";
let nowTimer;
let tick;
let cache = null;
let me;
let wp = { p: "month", off: 0 };
let libTab = "playlists";

let cfg = Object.assign({ mode: "auto", accent: "#ff8800", anim: true, goal: 90 }, JSON.parse(localStorage.getItem("cfg") || "{}"));
function applyCfg() {
  const r = document.documentElement;
  if (cfg.mode === "auto") r.removeAttribute("data-theme"); else r.dataset.theme = cfg.mode;
  r.style.setProperty("--accent", cfg.accent);
  r.classList.toggle("noanim", !cfg.anim);
  localStorage.setItem("cfg", JSON.stringify(cfg));
}
applyCfg();

/* ---------- 5. Auth + API ---------- */
async function login() {
  const verifier = rand(48);
  const challenge = b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  localStorage.setItem("verifier", verifier);
  const p = new URLSearchParams({ client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT, scope: SCOPES, code_challenge_method: "S256", code_challenge: challenge });
  location.href = `https://accounts.spotify.com/authorize?${p}`;
}

async function tokenRequest(body) {
  const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: CLIENT_ID, ...body }) });
  if (!r.ok) throw new Error("token");
  const j = await r.json();
  localStorage.setItem("access", j.access_token);
  localStorage.setItem("expires", Date.now() + j.expires_in * 1000 - 60000);
  if (j.refresh_token) localStorage.setItem("refresh", j.refresh_token);
}

async function token() {
  if (Date.now() < +localStorage.getItem("expires")) return localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("auth");
  await tokenRequest({ grant_type: "refresh_token", refresh_token: refresh });
  return localStorage.getItem("access");
}

async function api(path, retry = true) {
  const r = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${await token()}` } });
  if (r.status === 204) return null;
  if (r.status === 429 && retry) { await new Promise((s) => setTimeout(s, (+r.headers.get("Retry-After") || 2) * 1000)); return api(path, false); }
  if (r.status === 401 && retry) { localStorage.setItem("expires", 0); return api(path, false); }
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function call(method, path, body) {
  const r = await fetch(`https://api.spotify.com/v1${path}`, {
    method, headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 429) { await new Promise((s) => setTimeout(s, (+r.headers.get("Retry-After") || 2) * 1000)); return call(method, path, body); }
  return r;
}

/* ---------- 6. Data ---------- */
function rebuildSeen() { seen = new Map(); for (const [ts, uri] of lib.plays) { if (!seen.has(uri)) seen.set(uri, []); seen.get(uri).push(ts); } }

function addPlay(uri, ts, ms, meta) {
  const list = seen.get(uri);
  if (list && list.some((t) => Math.abs(t - ts) < 12e4)) return false;
  if (!list) seen.set(uri, [ts]); else list.push(ts);
  lib.plays.push([ts, uri, ms]);
  if (meta && !lib.meta[uri]) lib.meta[uri] = meta;
  else if (meta && meta.img && !lib.meta[uri].img) lib.meta[uri].img = meta.img;
  return true;
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => idb.set("lib", lib), 400); }

async function syncRecent() {
  try {
    const d = await api("/me/player/recently-played?limit=50");
    let added = 0;
    for (const it of d.items) if (addPlay(it.track.uri, Date.parse(it.played_at), it.track.duration_ms, trackMeta(it.track))) added++;
    if (added) { save(); if (tab === "now") renderNow(); }
  } catch (e) {}
}

async function importFiles(files) {
  const status = $("#importStatus");
  let entries = [];
  try {
    for (const f of files) {
      status.textContent = `Reading ${f.name}…`;
      if (/\.zip$/i.test(f.name)) {
        const zip = await JSZip.loadAsync(f);
        for (const name of Object.keys(zip.files)) {
          if (/(Streaming_History_Audio|endsong).*\.json$/i.test(name)) entries = entries.concat(JSON.parse(await zip.files[name].async("string")));
        }
      } else if (/\.json$/i.test(f.name)) {
        entries = entries.concat(JSON.parse(await f.text()));
      }
    }
  } catch (e) { status.textContent = "Could not read that file. Use the zip from Spotify's extended streaming history."; return; }
  let added = 0, skipped = 0;
  entries.sort((a, b) => (a.ts < b.ts ? -1 : 1));
  for (const e of entries) {
    const uri = e.spotify_track_uri;
    if (!uri || (e.ms_played ?? 0) < 30000) { skipped++; continue; }
    const meta = { n: e.master_metadata_track_name || "Unknown", a: e.master_metadata_album_artist_name || "Unknown", al: e.master_metadata_album_album_name || "", img: "" };
    if (addPlay(uri, Date.parse(e.ts), e.ms_played, meta)) added++; else skipped++;
  }
  await idb.set("lib", lib);
  status.textContent = `Merged ${fmtNum(added)} plays. Skipped ${fmtNum(skipped)} duplicates, podcasts or plays under 30 seconds.`;
  cache = null;
  renderStats();
}

function aggregate(kind, cutoffMs) {
  const since = cutoffMs === Infinity ? 0 : Date.now() - cutoffMs;
  const map = new Map();
  for (const [ts, uri, ms] of lib.plays) {
    if (ts < since) continue;
    const m = lib.meta[uri];
    if (!m) continue;
    const key = kind === "track" ? uri : kind === "artist" ? m.a : `${m.al}|${m.a}`;
    let o = map.get(key);
    if (!o) { o = { key, c: 0, ms: 0, uri, m }; map.set(key, o); }
    o.c++; o.ms += ms;
    if (m.img && !o.m.img) o.m = m;
  }
  return [...map.values()].sort((a, b) => (metric === "plays" ? b.c - a.c || b.ms - a.ms : b.ms - a.ms)).slice(0, 50);
}

/* full compute for wrapped / profile / hero */
function compute() {
  if (cache && cache.n === lib.plays.length) return cache;
  const A = new Map(), T = new Map(), L = new Map(), D = new Map(), M = new Map(), H = Array(24).fill(0);
  let ms = 0;
  for (const [ts, uri, d] of lib.plays) {
    const m = lib.meta[uri]; if (!m) continue;
    ms += d;
    let a = A.get(m.a); if (!a) { a = { name: m.a, c: 0, ms: 0, t: new Map(), first: ts, last: ts }; A.set(m.a, a); }
    a.c++; a.ms += d; a.first = Math.min(a.first, ts); a.last = Math.max(a.last, ts); a.t.set(uri, (a.t.get(uri) || 0) + 1);
    let t = T.get(uri); if (!t) { t = { uri, m, c: 0, ms: 0 }; T.set(uri, t); }
    t.c++; t.ms += d;
    const lk = `${m.al}|${m.a}`;
    let l = L.get(lk); if (!l) { l = { name: m.al || "Unknown album", artist: m.a, uri, c: 0, ms: 0 }; L.set(lk, l); }
    l.c++; l.ms += d;
    const k = dkey(ts);
    let dd = D.get(k); if (!dd) { dd = { k, c: 0, ms: 0, t: new Map() }; D.set(k, dd); }
    dd.c++; dd.ms += d; dd.t.set(uri, (dd.t.get(uri) || 0) + 1);
    M.set(k.slice(0, 7), (M.get(k.slice(0, 7)) || 0) + d);
    H[new Date(ts).getHours()]++;
  }
  const by = (x) => [...x.values()].sort((a, b) => b.c - a.c || b.ms - a.ms);
  const days = [...D.keys()].map(dn).sort((a, b) => a - b);
  const set = new Set(days);
  let best = days.length ? 1 : 0, run = 1;
  for (let i = 1; i < days.length; i++) { run = days[i] === days[i-1]+1 ? run+1 : 1; best = Math.max(best, run); }
  const today = dn(dkey(Date.now()));
  let cur = 0, p = set.has(today) ? today : today - 1;
  while (set.has(p)) { cur++; p--; }
  const peak = [...D.values()].sort((a, b) => b.ms - a.ms)[0];
  const s = { n: lib.plays.length, ms, A, T, L, D, M, H, artists: by(A), tracks: by(T), albums: by(L), best, cur, peak, first: lib.plays.length ? Math.min(...lib.plays.map(x => x[0])) : 0 };
  const hrs = ms / 36e5;
  s.xp = Math.round(hrs * 10 + s.n);
  s.level = Math.floor(Math.sqrt(s.xp / 25)) + 1;
  s.lo = 25 * (s.level - 1) ** 2;
  s.hi = 25 * s.level ** 2;
  s.badges = [
    { ic:"moon",  t:"Night Owl",     d:"20%+ of plays after 10 PM",           ok: (H.slice(22).reduce((a,b)=>a+b,0)+H.slice(0,4).reduce((a,b)=>a+b,0))/Math.max(1,s.n) > 0.2 },
    { ic:"sun",   t:"Early Bird",    d:"15%+ of plays 5 to 9 AM",             ok: H.slice(5,9).reduce((a,b)=>a+b,0)/Math.max(1,s.n) > 0.15 },
    { ic:"fire",  t:"On Fire",       d:"7 day streak",                        ok: best >= 7 },
    { ic:"bolt",  t:"Unstoppable",   d:"30 day streak",                       ok: best >= 30 },
    { ic:"star",  t:"Repeat Offender",d:"A song played 100 times",            ok: s.tracks[0]?.c >= 100 },
    { ic:"heart", t:"Loyalist",      d:"An artist played 500 times",          ok: s.artists[0]?.c >= 500 },
    { ic:"compass",t:"Explorer",     d:"250 different artists",               ok: A.size >= 250 },
    { ic:"globe", t:"Globetrotter",  d:"1,000 different artists",             ok: A.size >= 1000 },
    { ic:"headphones",t:"Marathoner",d:"Over 8 hours in a day",               ok: (peak?.ms || 0) >= 288e5 },
    { ic:"trophy",t:"10K Club",      d:"10,000 plays",                        ok: s.n >= 10000 },
    { ic:"hourglass",t:"100 Days",   d:"100 days of music",                   ok: ms >= 100*DAY },
    { ic:"crown", t:"Super Fan",     d:"An artist with 1,000 plays",          ok: s.artists[0]?.c >= 1000 },
  ];
  cache = s;
  return s;
}

/* ---------- 7. Render helpers ---------- */
function coverHtml(img, label, round, attr) {
  return img
    ? `<img class="cover${round ? " round" : ""}" src="${esc(img)}" alt="" loading="lazy" ${attr}>`
    : `<div class="cover${round ? " round" : ""}" ${attr}>${esc((label || "?")[0])}</div>`;
}
function rowHtml(i, r, round) {
  return `<div class="row"><span class="rank">${i+1}</span>${coverHtml(r.img, r.t, round, r.attr)}<div class="meta"><div class="t">${esc(r.t)}</div><div class="s">${esc(r.s)}</div></div><div class="v">${esc(r.v)}</div></div>`;
}
function valueText(o) { return metric === "plays" ? `${fmtNum(o.c)} plays` : fmtDur(o.ms); }

async function fillImages(rows, kind) {
  if (kind === "artist") {
    for (const r of rows.slice(0, 25)) {
      if (r.img) continue;
      if (lib.art[r.t] === undefined) {
        try {
          const d = await api(`/search?q=${encodeURIComponent(`artist:"${r.t}"`)}&type=artist&limit=1`);
          lib.art[r.t] = d.artists.items[0]?.images?.[1]?.url || d.artists.items[0]?.images?.[0]?.url || "";
          save();
        } catch (e) { return; }
      }
      const url = lib.art[r.t];
      const el = document.querySelector(`[data-k="${CSS.escape(r.t)}"]`);
      if (url && el && el.tagName !== "IMG") el.outerHTML = `<img class="cover round" src="${esc(url)}" alt="" data-k="${esc(r.t)}">`;
    }
    return;
  }
  const need = rows.filter((r) => !r.img && r.uri).map((r) => r.uri);
  const ids = [...new Set(need)].slice(0, 50).map((u) => u.split(":")[2]);
  if (!ids.length) return;
  try {
    const d = await api(`/tracks?ids=${ids.join(",")}`);
    for (const t of d.tracks) {
      if (!t) continue;
      const m = trackMeta(t);
      if (lib.meta[t.uri]) lib.meta[t.uri].img = m.img;
      document.querySelectorAll(`[data-u="${t.uri}"]`).forEach((el) => {
        if (el.tagName !== "IMG" && m.img) el.outerHTML = `<img class="cover" src="${esc(m.img)}" alt="" data-u="${t.uri}">`;
      });
    }
    save();
  } catch (e) {}
}

function countUp(el, to, dec = 0) {
  if (!cfg.anim) { el.textContent = to.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }); return; }
  const t0 = performance.now();
  const f = (t) => { const q = Math.min(1, (t - t0) / 1100); el.textContent = (to * (1 - Math.pow(1 - q, 3))).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (q < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function reveal() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll("[data-w]").forEach((e) => e.style.width = `${e.dataset.w}%`);
    document.querySelectorAll("[data-h]").forEach((e) => e.style.height = `${e.dataset.h}%`);
    document.querySelectorAll("[data-off]").forEach((e) => e.style.strokeDashoffset = e.dataset.off);
    document.querySelectorAll("[data-n]").forEach((el) => countUp(el, +el.dataset.n, +(el.dataset.d || 0)));
  }));
}

function ring(r, pct, color) {
  const c = 2 * Math.PI * r;
  return `<circle cx="60" cy="60" r="${r}" stroke="${color}" stroke-opacity=".18" stroke-width="10"/><circle class="fg" cx="60" cy="60" r="${r}" stroke="${color}" stroke-width="10" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - Math.min(1, pct))}"/>`;
}

/* ---------- 8. Renderers ---------- */

function controls() {
  return `<div class="ctrls">
    <div class="seg sm" id="rangeSeg">${Object.entries(RANGES).map(([k,v]) => `<button data-r="${k}" class="${k===range?"on":""}">${v[0]}</button>`).join("")}</div>
    <div class="seg sm" id="metricSeg">
      <button data-m="plays" class="${metric==="plays"?"on":""}">Plays</button>
      <button data-m="time"  class="${metric==="time"?"on":""}">Time</button>
    </div>
  </div>`;
}
function bindControls() {
  $("#rangeSeg").onclick  = (e) => { const k = e.target.dataset.r; if (k) { range = k; renderTop(); } };
  $("#metricSeg").onclick = (e) => { const k = e.target.dataset.m; if (k) { metric = k; renderTop(); } };
}

async function renderTop() {
  clearInterval(nowTimer);
  const kind = tab;
  const title = { track: "Top tracks", artist: "Top artists", album: "Top albums" }[kind];
  const view = $("#view");
  let rows;
  if (lib.plays.length) {
    rows = aggregate(kind, RANGES[range][1]).map((o) => ({
      t: kind === "track" ? o.m.n : kind === "artist" ? o.m.a : o.m.al || "Unknown album",
      s: kind === "track" ? `${o.m.a} · ${o.m.al}` : kind === "album" ? o.m.a : `${fmtNum(o.c)} plays`,
      img: kind === "artist" ? lib.art[o.m.a] || "" : o.m.img,
      v: kind === "artist" ? (metric === "plays" ? fmtDur(o.ms) : `${fmtNum(o.c)} plays`) : valueText(o),
      uri: o.uri,
      attr: kind === "artist" ? `data-k="${esc(o.m.a)}"` : `data-u="${esc(o.uri)}"`,
    }));
  } else if (kind !== "album") {
    view.innerHTML = `<div class="head"><h2>${title}</h2>${controls().replace(/<div class="seg sm" id="metricSeg">.*?<\/div>/, '<div id="metricSeg"></div>')}</div><div class="card"><div class="empty">Loading…</div></div>`;
    bindControls();
    try {
      const d = await api(`/me/top/${kind}s?time_range=${RANGES[range][2]}&limit=50`);
      rows = d.items.map((x) => kind === "track"
        ? { t: x.name, s: `${x.artists[0].name} · ${x.album.name}`, img: x.album.images[1]?.url || "", v: "", uri: x.uri, attr: `data-u="${x.uri}"` }
        : { t: x.name, s: (x.genres || []).slice(0,2).join(", "), img: x.images[1]?.url || x.images[0]?.url || "", v: "", attr: `data-k="${esc(x.name)}"` });
    } catch (e) { rows = []; }
  } else rows = [];
  view.innerHTML = `<div class="head"><h2>${title}</h2>${controls()}</div><div class="card">${rows.length ? rows.map((r,i) => rowHtml(i, r, kind === "artist")).join("") : `<div class="empty">Nothing here yet. Import your extended history on the Library tab, or keep this open to collect plays.</div>`}</div>`;
  bindControls();
  fillImages(rows, kind);
}

function renderStats() {
  clearInterval(nowTimer);
  const since = RANGES[range][1] === Infinity ? 0 : Date.now() - RANGES[range][1];
  const plays = lib.plays.filter((p) => p[0] >= since);
  const total = plays.reduce((s,p) => s + p[2], 0);
  const tracks  = new Set(plays.map(p => p[1]));
  const artists = new Set(plays.map(p => lib.meta[p[1]]?.a));
  const hours = Array(24).fill(0), days = Array(7).fill(0);
  for (const [ts] of plays) { const d = new Date(ts); hours[d.getHours()]++; days[d.getDay()]++; }
  const first = lib.plays.length ? Math.min(...lib.plays.map(p => p[0])) : 0;
  const bars = (arr) => { const mx = Math.max(1, ...arr); return arr.map((v) => `<div style="height:${(v/mx)*100}%" title="${fmtNum(v)} plays"></div>`).join(""); };
  $("#view").innerHTML = `
    <div class="head"><h2>Library</h2><div class="seg sm" id="rangeSeg">${Object.entries(RANGES).map(([k,v]) => `<button data-r="${k}" class="${k===range?"on":""}">${v[0]}</button>`).join("")}</div></div>
    <div class="tiles">
      <div class="tile"><b>${fmtNum(plays.length)}</b><span>Plays</span></div>
      <div class="tile"><b>${fmtNum(Math.round(total/36e5))}</b><span>Hours listened</span></div>
      <div class="tile"><b>${fmtNum(tracks.size)}</b><span>Different tracks</span></div>
      <div class="tile"><b>${fmtNum(artists.size)}</b><span>Different artists</span></div>
    </div>
    <div class="card pad"><h3>Time of day</h3><div class="chart">${bars(hours)}</div><div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>
    <div class="card pad"><h3>Day of week</h3><div class="chart">${bars(days)}</div><div class="axis wk">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<span>${d}</span>`).join("")}</div></div>
    <div class="card pad"><h3>Extended streaming history</h3>
      <p class="muted small">${first ? `Library covers ${new Date(first).toLocaleDateString(undefined,{month:"long",year:"numeric"})} to today.` : "Request your extended streaming history at spotify.com/account/privacy, then drop the zip here."}</p>
      <label class="drop" id="drop"><span>Drop the zip here or choose a file</span><span class="btn primary">Choose files</span><input id="file" type="file" accept=".zip,.json" multiple></label>
      <p class="muted small" id="importStatus" style="margin-top:.6rem"></p>
      <div class="actions"><button class="btn" id="exportBtn">Export library</button><button class="btn" id="clearBtn">Clear library</button></div>
    </div>`;
  $("#rangeSeg").onclick = (e) => { const k = e.target.dataset.r; if (k) { range = k; renderStats(); } };
  const drop = $("#drop");
  $("#file").onchange = (e) => importFiles([...e.target.files]);
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = () => drop.classList.remove("over");
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); importFiles([...e.dataTransfer.files]); };
  $("#exportBtn").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(lib)], { type: "application/json" })); a.download = "spotify-stats-library.json"; a.click(); };
  $("#clearBtn").onclick = async () => { if (confirm("Delete all collected and imported plays from this browser?")) { lib = { plays: [], meta: {}, art: {} }; seen = new Map(); cache = null; await idb.del("lib"); renderStats(); } };
}

function artistRow(a, i, max) {
  return `<div class="row" style="cursor:pointer"><span class="rank">${i+1}</span>${coverHtml(lib.art[a.name] || "", a.name, true, `data-k="${esc(a.name)}"`)}<div class="meta"><div class="t">${esc(a.name)}</div><div class="bar"><i data-w="${(a.c/max)*100}"></i></div></div><div class="v"><b>${fmtNum(a.c)}</b><br>${fmtDur(a.ms)}</div></div>`;
}

/* ---------- artist card grid (with hover expand affordance) ---------- */
function wrappedArtistCard(a, i, s) {
  const [c1, c2] = CARD_COLORS[i % CARD_COLORS.length];
  const hrs = Math.round(a.ms / 36e5);
  return `
    <div class="wrapped-card" data-arank="${i}" style="background:linear-gradient(145deg,${c1},${c2})">
      <div class="wc-top">
        <div class="wc-brand">${icon("spotify")}Spotify</div>
        <span class="wc-expand">${icon("expand")}</span>
      </div>
      <div class="wc-label">#${i+1} Artist</div>
      <div class="wc-img">${a.name && lib.art[a.name] ? `<img src="${esc(lib.art[a.name])}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}</div>
      <div class="wc-name">${esc(a.name)}</div>
      <div class="wc-desc">You spent ${hrs} hour${hrs===1?"":"s"} with ${esc(a.name)} across ${fmtNum(a.c)} plays. Tap to dive in.</div>
    </div>`;
}

function renderWrapped() {
  clearInterval(nowTimer);
  const s = compute();
  if (!s.n) {
    $("#view").innerHTML = `<h2>Nothing to show yet</h2><div class="card pad"><p class="muted">Import your extended streaming history to unlock your all-time stats, or keep this tab open to start collecting plays.</p><div class="actions"><button class="btn primary" id="goLib">Import history</button></div></div>`;
    $("#goLib").onclick = () => { tab = "stats"; render(); };
    return;
  }
  const a0 = s.artists[0], t0 = s.tracks[0], l0 = s.albums[0];
  const mins = s.ms / 6e4;
  const todayMin = (s.D.get(dkey(Date.now()))?.ms || 0) / 6e4;
  const months = [...s.M.entries()].sort().slice(-36);
  const mmax = Math.max(1, ...months.map(m => m[1]));
  const hmax = Math.max(1, ...s.H);
  const now = new Date();
  const start = dn(dkey(now)) - (52*7 + now.getDay());
  const cells = []; let hm = 1;
  for (let i = 0; i < 371; i++) { const v = s.D.get(new Date((start+i)*DAY).toISOString().slice(0,10))?.ms || 0; hm = Math.max(hm, v); cells.push(v); }
  const heat = cells.map((v, i) => (start+i > dn(dkey(now)) ? `<i class="x"></i>` : `<i style="--l:${v ? 0.25 + 0.75*(v/hm) : 0}"></i>`)).join("");
  const peakT = s.peak && [...s.peak.t.entries()].sort((a,b) => b[1] - a[1])[0];
  const feat = (k, cover, t, sub, n) => `<div class="feat glass">${cover}<div><div class="k">${k}</div><div class="t">${esc(t)}</div><div class="s">${esc(sub)}</div><div class="n">${n}</div></div></div>`;
  const topArtists = s.artists.slice(0, 6);

  $("#view").innerHTML = `
    <div class="wrapped-grid">${topArtists.map((a,i) => wrappedArtistCard(a, i, s)).join("")}</div>

    <div class="g4" style="margin-top:2rem">
      <div class="big glass"><b data-n="${Math.round(mins)}">0</b><span>Minutes listened</span></div>
      <div class="big glass"><b data-n="${Math.round(s.ms/36e5)}">0</b><span>Hours listened</span></div>
      <div class="big glass"><b data-n="${(s.ms/DAY).toFixed(1)}" data-d="1">0</b><span>Days of music</span></div>
      <div class="big glass"><b data-n="${(s.ms/(365*DAY)).toFixed(2)}" data-d="2">0</b><span>Years listened</span></div>
    </div>

    <div class="g2" style="margin-top:1rem">
      ${feat("Top song of all time",   coverHtml(t0.m.img, t0.m.n, false, `data-u="${esc(t0.uri)}"`), t0.m.n, t0.m.a, `${fmtNum(t0.c)} plays · ${fmtDur(t0.ms)}`)}
      ${feat("Top album of all time",  coverHtml(lib.meta[l0.uri]?.img, l0.name, false, `data-u="${esc(l0.uri)}"`), l0.name, l0.artist, `${fmtNum(l0.c)} plays · ${fmtDur(l0.ms)}`)}
      ${feat("Biggest listening day",  `<div class="cover glass" style="font-size:2rem">${icon("calendar")}</div>`, dlabel(s.peak.k), peakT ? `Most played: ${lib.meta[peakT[0]]?.n} (${peakT[1]}×)` : "", `${fmtDur(s.peak.ms)} · ${fmtNum(s.peak.c)} plays`)}
      ${feat("Longest streak",         `<div class="cover glass" style="font-size:2rem">${icon("fire")}</div>`, `${s.best} days in a row`, `Current streak: ${s.cur} days`, `Listening since ${new Date(s.first).toLocaleDateString(undefined,{month:"long",year:"numeric"})}`)}
    </div>

    <div class="g2" style="margin-top:1rem">
      <div class="card pad rings glass"><svg viewBox="0 0 120 120">${ring(52, todayMin/cfg.goal, "#ff375f")}${ring(38, s.cur/30, "#30d158")}${ring(24, (s.xp-s.lo)/(s.hi-s.lo), "#64d2ff")}</svg>
        <div class="rl">
          <div><i style="background:#ff375f"></i>Today <b>${Math.round(todayMin)}</b> / ${cfg.goal} min</div>
          <div><i style="background:#30d158"></i>Streak <b>${s.cur}</b> / 30 days</div>
          <div><i style="background:#64d2ff"></i>Level <b>${Math.round(((s.xp-s.lo)/(s.hi-s.lo))*100)}%</b> to ${s.level+1}</div>
        </div>
      </div>
      <div class="card pad lvl glass"><div class="muted small">Level</div><div class="n">${s.level}</div><div><b>${["Newcomer","Listener","Regular","Enthusiast","Audiophile","Superfan","Legend","Icon"][Math.min(7, Math.floor((s.level-1)/3))]}</b></div><div class="xp"><i data-w="${((s.xp-s.lo)/(s.hi-s.lo))*100}"></i></div><div class="muted small">${fmtNum(s.xp)} XP · ${fmtNum(s.hi-s.xp)} to level ${s.level+1}</div></div>
    </div>

    <h3 style="margin-bottom:-.5rem;margin-top:2rem">Top 10 artists</h3>
    <div class="card glass">${s.artists.slice(0, 10).map((a,i) => artistRow(a, i, a0.c)).join("")}</div>

    <div class="g2" style="margin-top:1rem">
      <div><h3>Top 10 tracks</h3><div class="card glass">${s.tracks.slice(0, 10).map((t,i) => rowHtml(i, { t: t.m.n, s: t.m.a, img: t.m.img, v: `${fmtNum(t.c)} plays`, attr: `data-u="${esc(t.uri)}"` })).join("")}</div></div>
      <div><h3>Top 10 albums</h3><div class="card glass">${s.albums.slice(0, 10).map((l,i) => rowHtml(i, { t: l.name, s: l.artist, img: lib.meta[l.uri]?.img, v: `${fmtNum(l.c)} plays`, attr: `data-u="${esc(l.uri)}"` })).join("")}</div></div>
    </div>

    <div class="card pad glass" style="margin-top:1rem"><h3>Past year</h3><div class="heat">${heat}</div></div>
    <div class="card pad glass" style="margin-top:1rem"><h3>Hours listened per month</h3><div class="chart">${months.map(([k,v]) => `<div data-h="${(v/mmax)*100}" title="${k}: ${Math.round(v/36e5)} hrs"></div>`).join("")}</div><div class="axis"><span>${months[0]?.[0] || ""}</span><span>${months[months.length-1]?.[0] || ""}</span></div></div>
    <div class="card pad glass" style="margin-top:1rem"><h3>When you listen</h3><div class="chart">${s.H.map((v,h) => `<div data-h="${(v/hmax)*100}" title="${h}:00 · ${fmtNum(v)} plays"></div>`).join("")}</div><div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>`;

  fillImages([
    { uri: t0.uri, img: t0.m.img }, { uri: l0.uri, img: lib.meta[l0.uri]?.img },
    ...s.tracks.slice(0, 10).map(t => ({ uri: t.uri, img: t.m.img })),
    ...s.albums.slice(0, 10).map(l => ({ uri: l.uri, img: lib.meta[l.uri]?.img })),
  ], "track");
  fillImages(s.artists.slice(0, 10).map(a => ({ t: a.name, img: lib.art[a.name] })), "artist");

  // animate cards in + bind expansion
  animateCardsIn();
  bindArtistCards(topArtists);

  reveal();
}

function animateCardsIn() {
  const cards = document.querySelectorAll(".wrapped-card");
  if (!cards.length) return;
  if (typeof anime === "undefined" || !cfg.anim) { cards.forEach(c => { c.style.opacity = 1; c.style.transform = "none"; }); return; }
  cards.forEach(c => { c.style.opacity = 0; });
  anime({
    targets: cards,
    translateY: [60, 0],
    opacity: [0, 1],
    scale: [0.9, 1],
    rotateZ: [4, 0],
    delay: anime.stagger(110),
    duration: 900,
    easing: "easeOutElastic(1,.65)",
  });
}

function bindArtistCards(artists) {
  document.querySelectorAll(".wrapped-card[data-arank]").forEach((el) => {
    el.onclick = () => openArtistHero(+el.dataset.arank);
  });
}

/* ---------- artist modal (small) — unchanged behaviour ---------- */
function openArtist(name) {
  if (document.querySelector(".ahx")) return;
  const s = compute();
  const a = s.A.get(name);
  if (!a) return;
  const rank = s.artists.findIndex(x => x.name === name) + 1;
  const songs = [...a.t.entries()].sort((x,y) => y[1] - x[1]).slice(0, 8);
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `<div class="sheet"><div class="top">${coverHtml(lib.art[name] || "", name, true, "")}<div><h2>${esc(name)}</h2><div class="muted">Rank #${rank} of ${fmtNum(s.A.size)} artists</div></div></div>
    <div class="g4"><div class="big"><b>${fmtNum(a.c)}</b><span>Plays</span></div><div class="big"><b>${fmtDur(a.ms)}</b><span>Listened</span></div></div>
    <div class="muted small">First played ${fd(a.first)} · Last played ${fd(a.last)} · ${((a.c/s.n)*100).toFixed(1)}% of all plays</div>
    <div><h3>Most played songs</h3>${songs.map(([u,c],i) => rowHtml(i, { t: lib.meta[u]?.n || "Unknown", s: lib.meta[u]?.al || "", img: lib.meta[u]?.img, v: `${fmtNum(c)} plays`, attr: "" })).join("")}</div>
    <button class="btn" id="closeM">Close</button></div>`;
  const close = () => { el.remove(); document.removeEventListener("keydown", esc2); };
  const esc2 = (e) => { if (e.key === "Escape") close(); };
  el.onclick = (e) => { if (e.target === el) close(); };
  document.body.appendChild(el);
  $("#closeM").onclick = close;
  document.addEventListener("keydown", esc2);
}

async function renderProfile() {
  clearInterval(nowTimer);
  const s = compute();
  if (me === undefined) { try { me = await api("/me"); } catch (e) { me = null; } }
  const name = me?.display_name || "You";
  const img = me?.images?.[0]?.url || "";
  const night = s.n ? (s.H.slice(22).reduce((a,b)=>a+b,0) + s.H.slice(0,4).reduce((a,b)=>a+b,0)) / s.n : 0;
  const morn  = s.n ? s.H.slice(5,9).reduce((a,b)=>a+b,0) / s.n : 0;
  const persona = night > 0.25 ? "Night Owl" : morn > 0.2 ? "Early Bird" : s.artists[0] && s.artists[0].c/Math.max(1,s.n) > 0.08 ? "Die-hard Fan" : "All-day Listener";
  const got = s.badges.filter(b => b.ok).length;
  $("#view").innerHTML = `
    <div class="card pad prof">${coverHtml(img, name, true, "")}<div><h2>${esc(name)}</h2><div class="muted">${persona}${s.n ? ` · Level ${s.level} · ${fmtNum(s.xp)} XP` : ""}</div>${me?.followers ? `<div class="muted small">${fmtNum(me.followers.total)} followers on Spotify</div>` : ""}</div></div>
    ${s.n ? `<div class="g4">
      <div class="big"><b data-n="${s.n}">0</b><span>Plays</span></div>
      <div class="big"><b data-n="${s.A.size}">0</b><span>Artists</span></div>
      <div class="big"><b data-n="${s.T.size}">0</b><span>Tracks</span></div>
      <div class="big"><b data-n="${s.best}">0</b><span>Best streak (days)</span></div></div>` : ""}
    <h3 style="margin-bottom:-.5rem">Achievements · ${got} of ${s.badges.length}</h3>
    <div class="card pad"><div class="badges">${s.badges.map(b => `<div class="badge${b.ok?"":" off"}"><div class="bico">${icon(b.ic)}</div><b>${esc(b.t)}</b><span>${esc(b.d)}</span></div>`).join("")}</div></div>`;
  reveal();
}

function renderSettings() {
  clearInterval(nowTimer);
  $("#view").innerHTML = `<h2>Settings</h2><div class="card pad">
    <div class="set"><div>Appearance<small>Match your device or pick one</small></div><div class="seg sm" id="modeSeg">${["auto","light","dark"].map(m => `<button data-m="${m}" class="${cfg.mode===m?"on":""}">${m[0].toUpperCase()+m.slice(1)}</button>`).join("")}</div></div>
    <div class="set"><div>Accent color<small>Drives charts, rings and the overview</small></div><div class="sws" id="sws">${SWATCHES.map(c => `<button class="sw${cfg.accent===c?" on":""}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}<input type="color" id="pick" value="${cfg.accent}"></div></div>
    <div class="set"><div>Animations<small>Count-ups, bars and rings</small></div><button class="sw2${cfg.anim?" on":""}" id="animT" aria-label="Toggle animations"></button></div>
    <div class="set"><div>Daily goal<small>Minutes for your Today ring</small></div><input type="number" id="goal" min="10" max="1440" value="${cfg.goal}"></div>
  </div>`;
  $("#modeSeg").onclick = (e) => { if (e.target.dataset.m) { cfg.mode = e.target.dataset.m; applyCfg(); renderSettings(); } };
  $("#sws").onclick = (e) => { if (e.target.dataset.c) { cfg.accent = e.target.dataset.c; applyCfg(); renderSettings(); } };
  $("#pick").oninput = (e) => { cfg.accent = e.target.value; applyCfg(); };
  $("#pick").onchange = renderSettings;
  $("#animT").onclick = () => { cfg.anim = !cfg.anim; applyCfg(); renderSettings(); };
  $("#goal").onchange = (e) => { cfg.goal = Math.max(10, +e.target.value || 90); applyCfg(); };
}

/* ---------- wrap / search / library (period-based wrap + search + library) ---------- */
function span(p, off) {
  const now = new Date(); let a, b;
  if (p === "week") { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay()+6)%7) - off*7); a = d; b = new Date(d.getFullYear(), d.getMonth(), d.getDate()+7); }
  else if (p === "month") { a = new Date(now.getFullYear(), now.getMonth()-off, 1); b = new Date(now.getFullYear(), now.getMonth()-off+1, 1); }
  else { a = new Date(now.getFullYear()-off, 0, 1); b = new Date(now.getFullYear()-off+1, 0, 1); }
  const f = (d, o) => d.toLocaleDateString(undefined, o);
  const label = p === "week"
    ? `${f(a,{month:"short",day:"numeric"})} to ${f(new Date(b-1),{month:"short",day:"numeric",year:"numeric"})}`
    : p === "month" ? f(a,{month:"long",year:"numeric"}) : String(a.getFullYear());
  return [+a, +b, label];
}
function periodStats(a, b) {
  const A = new Map(), T = new Map(), L = new Map(), dm = new Map(), H = Array(24).fill(0);
  let ms = 0, n = 0;
  for (const [ts, uri, d] of lib.plays) {
    if (ts < a || ts >= b) continue;
    const m = lib.meta[uri]; if (!m) continue;
    n++; ms += d;
    const ar = A.get(m.a) || { name: m.a, c: 0, ms: 0 }; ar.c++; ar.ms += d; A.set(m.a, ar);
    const t  = T.get(uri) || { uri, m, c: 0, ms: 0 }; t.c++; t.ms += d; T.set(uri, t);
    const lk = `${m.al}|${m.a}`; const l = L.get(lk) || { name: m.al || "Unknown album", artist: m.a, uri, c: 0, ms: 0 }; l.c++; l.ms += d; L.set(lk, l);
    H[new Date(ts).getHours()]++;
    const k = dkey(ts); dm.set(k, (dm.get(k) || 0) + d);
  }
  const by = (x) => [...x.values()].sort((p,q) => q.c - p.c || q.ms - p.ms);
  return { n, ms, H, days: dm.size, A, artists: by(A), tracks: by(T), albums: by(L), peak: [...dm.entries()].sort((p,q) => q[1]-p[1])[0] };
}
async function savePlaylist(name, uris) {
  const r = await call("POST", "/me/playlists", { name, public: false, description: "Made from Stats for Spotify" });
  if (!r.ok) { toast("Could not create playlist. Try reconnecting"); return; }
  const p = await r.json();
  let x = await call("POST", `/playlists/${p.id}/items`, { uris });
  if (!x.ok) x = await call("POST", `/playlists/${p.id}/tracks`, { uris });
  toast(x.ok ? "Playlist saved to Spotify" : "Playlist created but tracks failed to add");
}
function shareCard(label, s) {
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
  const g = c.getContext("2d");
  const ac = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff8800";
  const gr = g.createLinearGradient(0,0,1080,1350); gr.addColorStop(0, ac); gr.addColorStop(1, "#5e5ce6");
  g.fillStyle = gr; g.fillRect(0,0,1080,1350);
  g.fillStyle = "#fff"; g.font = "600 44px system-ui"; g.fillText(`${label} Wrapped`, 80, 130);
  g.font = "800 92px system-ui"; g.fillText(s.artists[0].name.slice(0,16), 80, 270);
  g.font = "500 40px system-ui"; g.fillText(`${Math.round(s.ms/6e4).toLocaleString()} minutes · ${s.n.toLocaleString()} plays`, 80, 345);
  g.font = "700 44px system-ui"; g.fillText("Top artists", 80, 470); g.fillText("Top tracks", 570, 470);
  g.font = "500 34px system-ui";
  s.artists.slice(0,5).forEach((x,i) => g.fillText(`${i+1}. ${x.name.slice(0,17)}`, 80, 545+i*85));
  s.tracks.slice(0,5).forEach((x,i) => g.fillText(`${i+1}. ${x.m.n.slice(0,19)}`, 570, 545+i*85));
  c.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `wrapped-${label.replace(/\W+/g,"-")}.png`; a.click(); });
}

function renderWrap() {
  const [a, b, label] = span(wp.p, wp.off);
  const [pa, pb] = span(wp.p, wp.off + 1);
  const s = periodStats(a, b), q = periodStats(pa, pb);
  const all = compute();
  const dl = (x, y) => (y ? `<span class="dl ${x>=y?"up":"dn"}">${x>=y?"▲":"▼"} ${Math.abs(Math.round(((x-y)/y)*100))}%</span>` : "");
  const head = `<div class="head"><h2>Wrapped</h2><div class="ctrls"><div class="seg sm" id="wseg">${["week","month","year"].map(k => `<button data-w="${k}" class="${k===wp.p?"on":""}">${k[0].toUpperCase()+k.slice(1)}</button>`).join("")}</div><div class="seg sm" id="wnav"><button data-d="1">‹</button><button data-d="-1" ${wp.off===0?"disabled":""}>›</button></div></div></div><p class="sub">${label}</p>`;
  const bind = () => {
    $("#wseg").onclick = (e) => { if (e.target.dataset.w) { wp = { p: e.target.dataset.w, off: 0 }; renderWrap(); } };
    $("#wnav").onclick = (e) => { const d = e.target.dataset.d; if (d) { wp.off = Math.max(0, wp.off + +d); renderWrap(); } };
  };
  if (!s.n) { $("#view").innerHTML = `${head}<div class="card pad"><p class="muted">No plays recorded for this period.</p></div>`; return bind(); }
  const a0 = s.artists[0];
  const ph = s.H.indexOf(Math.max(...s.H));
  const persona = ph >= 22 || ph < 4 ? "Night Owl" : ph < 9 ? "Early Bird" : ph < 17 ? "Daytime Listener" : "Evening Regular";
  const hl = (h) => `${h%12||12} ${h<12?"AM":"PM"}`;
  const fresh = s.artists.filter(x => all.A.get(x.name) && all.A.get(x.name).first >= a).length;
  const hmax = Math.max(1, ...s.H), amax = a0.c;
  const tiles = [
    [Math.round(s.ms/6e4), "Minutes", dl(s.ms, q.ms)],
    [s.n, "Plays", dl(s.n, q.n)],
    [s.A.size, "Artists", dl(s.A.size, q.A.size)],
    [s.days, "Active days", ""],
    [fresh, "New artists", ""],
    [(s.n/s.tracks.length).toFixed(1), "Plays per track", ""],
  ];
  $("#view").innerHTML = `${head}
    <section class="hero"><div><div class="hl">Your top artist · ${label}</div><h1>${esc(a0.name)}</h1>
      <div class="hs"><b data-n="${a0.c}">0</b> plays · <b data-n="${Math.round(a0.ms/6e4)}">0</b> minutes</div>
      <div class="hr">${persona} · peak listening around ${hl(ph)}${s.peak ? ` · biggest day ${dlabel(s.peak[0])}` : ""}</div></div>
      ${coverHtml(lib.art[a0.name] || "", a0.name, true, `data-k="${esc(a0.name)}"`)}</section>
    <div class="g4">${tiles.map(([v,l,d]) => `<div class="big"><b>${typeof v==="number"?fmtNum(v):v}</b><span>${l}${d}</span></div>`).join("")}</div>
    <div class="actions" style="margin-top:0"><button class="btn primary" id="wPlay">${icon("play")} Play top tracks</button><button class="btn" id="wSave">Save as playlist</button><button class="btn" id="wCard">Download card</button></div>
    <h3 style="margin-bottom:-.5rem">Top artists</h3>
    <div class="card">${s.artists.slice(0,5).map((x,i) => artistRow(x, i, amax)).join("")}</div>
    <div class="g2">
      <div><h3>Top tracks</h3><div class="card">${s.tracks.slice(0,8).map((t,i) => rowHtml(i, { t: t.m.n, s: t.m.a, img: t.m.img, v: `${fmtNum(t.c)} plays`, attr: `data-u="${esc(t.uri)}"` })).join("")}</div></div>
      <div><h3>Top albums</h3><div class="card">${s.albums.slice(0,8).map((l,i) => rowHtml(i, { t: l.name, s: l.artist, img: lib.meta[l.uri]?.img, v: `${fmtNum(l.c)} plays`, attr: `data-u="${esc(l.uri)}"` })).join("")}</div></div>
    </div>
    <div class="card pad"><h3>When you listened</h3><div class="chart">${s.H.map((v,h) => `<div data-h="${(v/hmax)*100}" title="${hl(h)} · ${fmtNum(v)} plays"></div>`).join("")}</div><div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>`;
  bind();
  $("#wPlay").onclick = () => playMany(s.tracks.slice(0,30).map(t => t.uri));
  $("#wSave").onclick = () => savePlaylist(`Top tracks · ${label}`, s.tracks.slice(0,30).map(t => t.uri));
  $("#wCard").onclick = () => shareCard(label, s);
  fillImages([...s.tracks.slice(0,8).map(t => ({ uri: t.uri, img: t.m.img })), ...s.albums.slice(0,8).map(l => ({ uri: l.uri, img: lib.meta[l.uri]?.img }))], "track");
  fillImages(s.artists.slice(0,5).map(x => ({ t: x.name, img: lib.art[x.name] })), "artist");
  reveal();
}

function renderSearch() {
  $("#view").innerHTML = `<h2>Search</h2><input id="q" class="inp" placeholder="Songs, albums, artists, playlists" autocomplete="off"><div id="res"></div><p class="muted small">Click a cover to play. Shift-click a track cover to queue it.</p>`;
  let tm;
  $("#q").oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => doSearch(e.target.value.trim()), 350); };
  $("#q").focus();
}
async function doSearch(q) {
  const box = $("#res"); if (!box) return;
  if (!q) { box.innerHTML = ""; return; }
  try {
    const d = await api(`/search?q=${encodeURIComponent(q)}&type=track,album,artist,playlist&limit=8`);
    const sec = (title, items, fn) => { const l = (items || []).filter(Boolean); return l.length ? `<h3 style="margin-top:1rem">${title}</h3><div class="card">${l.map(fn).join("")}</div>` : ""; };
    const im = (x) => (x.images && (x.images[1]?.url || x.images[0]?.url)) || "";
    if (!$("#res")) return;
    box.innerHTML =
      sec("Tracks", d.tracks?.items, (x,i) => rowHtml(i, { t: x.name, s: `${x.artists[0]?.name||""} · ${x.album.name}`, img: x.album.images[1]?.url, v: fmtClock(x.duration_ms), attr: `data-u="${esc(x.uri)}"` })) +
      sec("Artists", d.artists?.items, (x,i) => rowHtml(i, { t: x.name, s: (x.genres||[]).slice(0,2).join(", "), img: im(x), v: "Artist", attr: `data-p="${esc(x.uri)}"` }, true)) +
      sec("Albums", d.albums?.items, (x,i) => rowHtml(i, { t: x.name, s: x.artists[0]?.name||"", img: im(x), v: x.release_date?.slice(0,4) || "", attr: `data-p="${esc(x.uri)}"` })) +
      sec("Playlists", d.playlists?.items, (x,i) => rowHtml(i, { t: x.name, s: x.owner?.display_name||"", img: im(x), v: "Playlist", attr: `data-p="${esc(x.uri)}"` }));
  } catch (e) { box.innerHTML = `<div class="card"><div class="empty">Search failed. Try reconnecting Spotify.</div></div>`; }
}

async function renderLibrary() {
  $("#view").innerHTML = `<div class="head"><h2>Library</h2><div class="seg sm" id="lseg">${[["playlists","Playlists"],["liked","Liked"],["albums","Albums"],["artists","Following"]].map(([k,l]) => `<button data-l="${k}" class="${k===libTab?"on":""}">${l}</button>`).join("")}</div></div><div class="card" id="lbox"><div class="empty">Loading…</div></div>`;
  $("#lseg").onclick = (e) => { if (e.target.dataset.l) { libTab = e.target.dataset.l; renderLibrary(); } };
  const im = (x) => (x?.images && (x.images[1]?.url || x.images[0]?.url)) || "";
  let rows = [];
  try {
    if (libTab === "playlists") {
      const d = await api("/me/playlists?limit=50");
      rows = d.items.filter(Boolean).map(x => ({ t: x.name, s: `${((x.items||x.tracks||{}).total ?? "")} tracks`, img: im(x), v: "Playlist", attr: `data-p="${esc(x.uri)}"` }));
    } else if (libTab === "liked") {
      const d = await api("/me/tracks?limit=50");
      rows = d.items.map(i => i.track).filter(Boolean).map(x => ({ t: x.name, s: `${x.artists[0]?.name||""} · ${x.album.name}`, img: im(x.album), v: fmtClock(x.duration_ms), attr: `data-u="${esc(x.uri)}"` }));
    } else if (libTab === "albums") {
      const d = await api("/me/albums?limit=50");
      rows = d.items.map(i => i.album).filter(Boolean).map(x => ({ t: x.name, s: x.artists[0]?.name||"", img: im(x), v: x.release_date?.slice(0,4)||"", attr: `data-p="${esc(x.uri)}"` }));
    } else {
      const d = await api("/me/following?type=artist&limit=50");
      rows = d.artists.items.map(x => ({ t: x.name, s: (x.genres||[]).slice(0,2).join(", "), img: im(x), v: "Artist", attr: `data-p="${esc(x.uri)}"` }));
    }
  } catch (e) {}
  const box = $("#lbox"); if (tab !== "library" || !box) return;
  box.innerHTML = rows.length ? rows.map((r,i) => rowHtml(i, r, libTab === "artists")).join("") : `<div class="empty">Nothing here, or Spotify needs you to reconnect.</div>`;
}

/* ---------- 9. Artist HERO (new, scroll slides) ---------- */

function buildArtistHeroSlide(a, rank, s, i) {
  const [c1, c2] = CARD_COLORS[i % CARD_COLORS.length];
  const hrs = a.ms / 36e5;
  // per-artist aggregates
  const mine = lib.plays.filter(p => lib.meta[p[1]]?.a === a.name);
  const H = Array(24).fill(0), W = Array(7).fill(0);
  const tc = new Map(), ac = new Map();
  for (const [ts, uri] of mine) {
    const d = new Date(ts);
    H[d.getHours()]++;
    W[(d.getDay() + 6) % 7]++; // Mon = 0
    tc.set(uri, (tc.get(uri) || 0) + 1);
    const m = lib.meta[uri];
    if (m?.al) ac.set(m.al, (ac.get(m.al) || 0) + 1);
  }
  const peakH = H.indexOf(Math.max(...H));
  const peakD = W.indexOf(Math.max(...W));
  const totalPct = s.n ? ((a.c / s.n) * 100).toFixed(1) : "0.0";
  const topTracks = [...tc.entries()].sort((x,y) => y[1] - x[1]).slice(0, 5);
  const topAlbums = [...ac.entries()].sort((x,y) => y[1] - x[1]).slice(0, 3);
  const backdrop = topTracks.length ? lib.meta[topTracks[0][0]]?.img || "" : "";
  const trackMax = Math.max(1, ...topTracks.map(t => t[1]));
  const hMax = Math.max(1, ...H), wMax = Math.max(1, ...W);
  const HLbl = (h) => h === 0 ? "12a" : h === 6 ? "6a" : h === 12 ? "12p" : h === 18 ? "6p" : h === 23 ? "11p" : "";
  const WDlbl = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const chips = [
    [a.c, "plays"],
    [`${hrs.toFixed(1)}h`, "listened"],
    [`#${rank}`, "your rank"],
    [`${totalPct}%`, "of everything"],
    [fd(a.first), "first play"],
    [fd(a.last), "last play"],
    [tc.size, "unique tracks"],
  ].map(([v, l]) => `<div class="ahp-chip"><b${typeof v === "number" ? ` data-n="${v}"` : ""}>${typeof v === "number" ? fmtNum(v) : esc(v)}</b><span>${l}</span></div>`).join("");

  const trackRows = topTracks.map(([uri, c], k) => {
    const m = lib.meta[uri] || { n: "Unknown", al: "" };
    return `<div class="ahp-row"><b>${k+1}</b><div><em>${esc(m.n)}</em><small>${esc(m.al)}</small><div class="ahp-hbar"><i data-w="${(c/trackMax)*100}"></i></div></div><span>${c}×</span></div>`;
  }).join("");

  const albumRows = topAlbums.map(([al, c], k) => `<div class="ahp-row"><b>${k+1}</b><div><em>${esc(al)}</em><small>${c} play${c===1?"":"s"}</small></div></div>`).join("");

  const portrait = `
    <div class="sc" style="background:linear-gradient(145deg,${c1},${c2})">
      <div class="wc-top">
        <div class="wc-brand">${icon("spotify")}Spotify</div>
      </div>
      <div class="wc-label">#${rank} Artist · All-time</div>
      <div class="wc-img">${a.name && lib.art[a.name] ? `<img src="${esc(lib.art[a.name])}" alt="" onerror="this.style.display='none'">` : ""}</div>
      <div class="wc-name">${esc(a.name)}</div>
      <div class="wc-desc">${hrs.toFixed(1)} hours · ${fmtNum(a.c)} plays · ${totalPct}% of your listening.</div>
    </div>`;

  return `
    <section class="ahs" data-i="${i}" data-bg-image="${esc(backdrop)}">
      <div class="ahc">${portrait}</div>
      <div class="ahp">
        <h3 class="ahp-title">${esc(a.name)}</h3>
        <div class="ahp-chips">${chips}</div>

        <h5>Your top ${topTracks.length} tracks by them</h5>
        ${trackRows || `<div class="ahp-row"><div><em>No tracks recorded</em></div></div>`}

        ${topAlbums.length ? `<h5>Top albums</h5>${albumRows}` : ""}

        <h5>When you listen to them</h5>
        <div class="ahp-bars">${H.map((v, k) => `<i class="${k===peakH?"hi":""}" data-h="${Math.round((v/hMax)*100)}" title="${HLbl(k)||k+":00"} · ${v} plays"></i>`).join("")}</div>
        <div class="ahp-lbl"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>

        <h5>Day of week</h5>
        <div class="ahp-bars">${W.map((v, k) => `<i class="${k===peakD?"hi":""}" data-h="${Math.round((v/wMax)*100)}" title="${WDlbl[k]} · ${v} plays"></i>`).join("")}</div>
        <div class="ahp-lbl">${WDlbl.map(d => `<span>${d}</span>`).join("")}</div>
      </div>
    </section>`;
}

function openArtistHero(startIdx = 0) {
  if (document.querySelector(".ahx")) return;
  const s = compute();
  if (!s.artists.length) return;
  const artists = s.artists.slice(0, 6);
  startIdx = Math.max(0, Math.min(artists.length - 1, startIdx));

  const bgSolid = (i) => CARD_COLORS[i % CARD_COLORS.length][0];

  const overlay = document.createElement("div");
  overlay.className = "ahx";
  overlay.innerHTML = `
    <div class="ahx-bg"><img class="ahx-art" alt=""><img class="ahx-art" alt=""></div>
    <div class="ahd" style="visibility:hidden">
      ${artists.map((a, i) => buildArtistHeroSlide(a, s.artists.findIndex(x => x.name === a.name) + 1, s, i)).join("")}
    </div>
    <div class="ahdots">${artists.map((_, i) => `<button data-k="${i}" aria-label="Artist ${i+1}"></button>`).join("")}</div>
    <button class="ahx-close" aria-label="Close">${icon("close")}</button>
    <div class="ahhint">Scroll ↓</div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const deck = overlay.querySelector(".ahd");
  const bg = overlay.querySelector(".ahx-bg");
  const bgLayers = [...bg.querySelectorAll(".ahx-art")];
  const dots = [...overlay.querySelectorAll(".ahdots button")];
  const hint = overlay.querySelector(".ahhint");
  const slides = [...deck.children];
  let active = -1;
  let activeBgLayer = 0;

  bg.style.backgroundColor = bgSolid(startIdx);
  deck.scrollTop = startIdx * deck.clientHeight;

  const setActive = (k) => {
    if (k === active || k < 0 || k >= slides.length) return;
    active = k;
    const image = slides[k].dataset.bgImage;
    if (image) {
      const nextLayer = 1 - activeBgLayer;
      bgLayers[nextLayer].src = image;
      bgLayers[nextLayer].classList.add("on");
      bgLayers[activeBgLayer].classList.remove("on");
      activeBgLayer = nextLayer;
    } else {
      bgLayers.forEach(layer => layer.classList.remove("on"));
    }
    if (cfg.anim && typeof anime !== "undefined") {
      anime({ targets: bg, backgroundColor: bgSolid(k), duration: 700, easing: "easeInOutQuad" });
    } else {
      bg.style.backgroundColor = bgSolid(k);
    }
    dots.forEach((d, i) => d.classList.toggle("on", i === k));
    animatePanelIn(slides[k]);
  };

  const animatePanelIn = (slide) => {
    if (cfg.anim && typeof anime !== "undefined") {
      anime.remove(slide.querySelectorAll(".ahp *"));
      anime({ targets: slide.querySelector(".ahp"), translateY: [40, 0], opacity: [0, 1], duration: 600, easing: "easeOutExpo" });
      anime({ targets: slide.querySelectorAll(".ahp-chip"), scale: [0.7, 1], opacity: [0, 1], delay: anime.stagger(55, { start: 120 }), duration: 600, easing: "easeOutBack" });
      anime({ targets: slide.querySelectorAll(".ahp-row"), translateX: [24, 0], opacity: [0, 1], delay: anime.stagger(55, { start: 250 }), duration: 500 });
      anime({ targets: slide.querySelectorAll(".ahp-bars i"), height: (el) => `${el.dataset.h}%`, delay: anime.stagger(20, { start: 350 }), duration: 800, easing: "easeOutElastic(1,.7)" });
      anime({ targets: slide.querySelectorAll(".ahp-hbar i"), width: (el) => `${el.dataset.w}%`, delay: anime.stagger(60, { start: 400 }), duration: 900 });
      // count up the numeric chips
      slide.querySelectorAll(".ahp [data-n]").forEach(el => countUp(el, +el.dataset.n));
    } else {
      slide.querySelectorAll(".ahp-bars i").forEach(el => el.style.height = `${el.dataset.h}%`);
      slide.querySelectorAll(".ahp-hbar i").forEach(el => el.style.width = `${el.dataset.w}%`);
    }
    // card entrance
    const card = slide.querySelector(".ahc");
    if (card && cfg.anim && typeof anime !== "undefined") {
      anime.remove(card);
      anime({ targets: card, scale: [0.9, 1], opacity: [0, 1], rotate: [-3, 0], duration: 700, easing: "easeOutExpo" });
    }
  };

  deck.addEventListener("scroll", () => {
    const k = Math.round(deck.scrollTop / deck.clientHeight);
    if (k !== active) setActive(k);
    hint.style.opacity = 0;
  });

  dots.forEach((d, i) => d.onclick = () => deck.scrollTo({ top: i * deck.clientHeight, behavior: "smooth" }));

  const close = () => {
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (cfg.anim && typeof anime !== "undefined") {
      anime({ targets: overlay, opacity: [1, 0], duration: 350, easing: "easeInQuad", complete: () => overlay.remove() });
    } else {
      overlay.remove();
    }
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); deck.scrollTo({ top: (active+1) * deck.clientHeight, behavior: "smooth" }); }
    else if (e.key === "ArrowUp" || e.key === "PageUp")   { e.preventDefault(); deck.scrollTo({ top: Math.max(0, active-1) * deck.clientHeight, behavior: "smooth" }); }
  };
  overlay.querySelector(".ahx-close").onclick = close;
  document.addEventListener("keydown", onKey);

  // reveal + entry animation
  requestAnimationFrame(() => {
    deck.style.visibility = "visible";
    setActive(startIdx);
    if (cfg.anim && typeof anime !== "undefined") {
      anime({ targets: overlay, opacity: [0, 1], duration: 350, easing: "easeOutQuad" });
      anime({ targets: dots, translateX: [20, 0], opacity: [0, 0.4], delay: anime.stagger(40), duration: 500 });
      anime({ targets: hint, translateY: [0, 8], loop: true, direction: "alternate", duration: 700, easing: "easeInOutSine" });
    } else {
      dots.forEach(d => d.style.opacity = 0.4);
    }
  });
}

/* ---------- 10. Player bar ---------- */
const playerStyles = document.createElement("style");
playerStyles.textContent = `
  body.hasbar main{padding-bottom:8rem}
  #pbar{position:fixed;left:0;right:0;bottom:0;z-index:20;background:var(--nav);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-top:1px solid var(--line);padding:.6rem 1rem;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,1.4fr) minmax(0,1fr);gap:1rem;align-items:center}
  #pbar .l{display:flex;gap:.75rem;align-items:center;min-width:0}
  #pbar .l .cover{width:48px;height:48px}
  #pbar .c{display:grid;gap:.25rem;justify-items:center}
  #pbar .k{display:flex;gap:.4rem;align-items:center}
  #pbar .k button,#pbar .r button{width:34px;height:34px;border-radius:50%;color:var(--muted);display:grid;place-items:center}
  #pbar .k button:hover,#pbar .r button:hover{background:var(--hover);color:var(--text)}
  #pbar .k button.on,#pbar .r button.on{color:var(--accent)}
  #pbar button .ico{width:16px;height:16px}
  #pbar #pp{background:var(--text);color:var(--bg);width:40px;height:40px}
  #pbar #pp .ico{width:18px;height:18px}
  #pbar #pp:hover{background:var(--text);color:var(--bg);transform:scale(1.06)}
  #pbar .sk{display:flex;gap:.5rem;align-items:center;width:100%;font-size:.72rem;color:var(--muted);font-variant-numeric:tabular-nums}
  #pbar input[type=range]{flex:1;accent-color:var(--accent);min-width:0}
  #pbar .r{display:flex;gap:.25rem;align-items:center;justify-content:flex-end}
  #pbar .r input{max-width:90px}
  .toast{position:fixed;left:50%;bottom:6.5rem;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:.6rem 1.1rem;border-radius:980px;font-size:.88rem;z-index:60}
  @media(max-width:760px){#pbar{grid-template-columns:1fr auto;gap:.4rem}#pbar .c{grid-column:1/-1;grid-row:2}#pbar .r{grid-column:2;grid-row:1}#pbar .r input{display:none}}
`;
document.head.appendChild(playerStyles);

document.body.insertAdjacentHTML("beforeend", `<div id="pbar" hidden>
  <div class="l">
    <img class="cover" id="pc" alt="">
    <div class="meta"><div class="t" id="pt"></div><div class="s" id="pa"></div></div>
    <button id="plk" data-a="like" aria-label="Like">${icon("heart")}</button>
  </div>
  <div class="c">
    <div class="k">
      <button id="psh" data-a="shuffle" aria-label="Shuffle">${icon("shuffle")}</button>
      <button data-a="prev" aria-label="Previous">${icon("prev")}</button>
      <button id="pp" data-a="toggle" aria-label="Play or pause">${icon("play")}</button>
      <button data-a="next" aria-label="Next">${icon("next")}</button>
      <button id="prp" data-a="repeat" aria-label="Repeat">${icon("repeat")}</button>
    </div>
    <div class="sk"><span id="pel">0:00</span><input type="range" id="psk" min="0" max="1" step="1000" value="0" aria-label="Seek through track"><span id="pdu">0:00</span></div>
  </div>
  <div class="r">
    <button data-a="queue" aria-label="Queue">${icon("queue")}</button>
    <button data-a="devices" aria-label="Devices">${icon("device")}</button>
    <input type="range" id="pvo" min="0" max="100" value="50" aria-label="Volume">
  </div>
</div>`);

let ps = null, at = 0, likeId = null, isLiked = false, seeking = false, volDrag = false;

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function modal(html) {
  const el = document.createElement("div"); el.className = "modal";
  el.innerHTML = `<div class="sheet">${html}<button class="btn" data-x>Close</button></div>`;
  el.onclick = (e) => { if (e.target === el || e.target.dataset.x !== undefined) el.remove(); };
  document.body.appendChild(el);
  return el;
}

async function poll() {
  try { ps = await api("/me/player"); } catch (e) { return; }
  at = Date.now();
  paint();
}
function paint() {
  const t = ps && ps.item;
  $("#pbar").hidden = !t;
  document.body.classList.toggle("hasbar", !!t);
  if (!t) { document.title = "Stats for Spotify"; return; }
  const img = t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "";
  if (img && $("#pc").getAttribute("src") !== img) $("#pc").src = img;
  $("#pt").textContent = t.name;
  $("#pa").textContent = t.artists ? t.artists.map(a => a.name).join(", ") : (t.show?.name || "");
  $("#pp").innerHTML = icon(ps.is_playing ? "pause" : "play");
  $("#psh").classList.toggle("on", !!ps.shuffle_state);
  $("#prp").classList.toggle("on", ps.repeat_state !== "off");
  $("#psk").max = t.duration_ms;
  $("#pdu").textContent = fmtClock(t.duration_ms);
  if (ps.device && ps.device.volume_percent != null && !volDrag) $("#pvo").value = ps.device.volume_percent;
  document.title = `${ps.is_playing ? "▶ " : ""}${t.name} · ${$("#pa").textContent}`;
  if (t.id !== likeId) { likeId = t.id; checkLike(t.id); }
  updateMediaSession(t);
  tickBar();
}
function tickBar() {
  if (!ps || !ps.item || seeking) return;
  const p = Math.min(ps.item.duration_ms, ps.progress_ms + (ps.is_playing ? Date.now() - at : 0));
  $("#psk").value = p;
  $("#psk").style.setProperty("--progress", `${Math.min(100, (p / ps.item.duration_ms) * 100)}%`);
  $("#pel").textContent = fmtClock(p);
}
async function checkLike(id) {
  try { const r = await api(`/me/tracks/contains?ids=${id}`); isLiked = !!r[0]; } catch (e) { isLiked = false; }
  $("#plk").innerHTML = icon(isLiked ? "heartFill" : "heart");
  $("#plk").classList.toggle("on", isLiked);
}
async function act(method, path) {
  const r = await call(method, `/me/player/${path}`);
  if (r.status === 403) toast("Playback control needs Spotify Premium");
  if (r.status === 404) toast("No active device. Open Spotify somewhere first");
  setTimeout(poll, 350);
}
let mediaTrackId = null;
function updateMediaSession(track) {
  const session = navigator.mediaSession;
  if (!session) return;
  if (mediaTrackId !== track.id && "MediaMetadata" in window) {
    mediaTrackId = track.id;
    session.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists?.map((artist) => artist.name).join(", ") || "",
      album: track.album?.name || "",
      artwork: (track.album?.images || []).map((image) => ({ src: image.url })),
    });
  }
  session.playbackState = ps.is_playing ? "playing" : "paused";
  if (typeof session.setPositionState === "function" && track.duration_ms > 0) {
    session.setPositionState({
      duration: track.duration_ms / 1000,
      playbackRate: 1,
      position: Math.min(track.duration_ms, ps.progress_ms || 0) / 1000,
    });
  }
}
if (navigator.mediaSession && typeof navigator.mediaSession.setActionHandler === "function") {
  for (const [action, handler] of [
    ["play", () => act("PUT", "play")],
    ["pause", () => act("PUT", "pause")],
    ["previoustrack", () => act("POST", "previous")],
    ["nexttrack", () => act("POST", "next")],
  ]) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
      if (error.name !== "NotSupportedError") throw error;
    }
  }
}
async function playBody(body) {
  let r = await call("PUT", "/me/player/play", body);
  if (r.status === 404) {
    let d = null; try { d = await api("/me/player/devices"); } catch (e) {}
    const dev = d?.devices?.[0];
    if (!dev) { toast("Open Spotify on a device first"); return; }
    r = await call("PUT", `/me/player/play?device_id=${dev.id}`, body);
  }
  if (r.status === 403) toast("Playback needs Spotify Premium and a reconnect");
  setTimeout(poll, 450);
}
const play     = (uri) => playBody(uri.startsWith("spotify:track:") ? { uris: [uri] } : { context_uri: uri });
const playMany = (uris) => playBody({ uris: uris.slice(0, 100) });
const enqueue  = async (uri) => { const r = await call("POST", `/me/player/queue?uri=${encodeURIComponent(uri)}`); toast(r.ok ? "Added to queue" : "Could not queue that"); };

async function showDevices() {
  let d = { devices: [] }; try { d = await api("/me/player/devices"); } catch (e) {}
  const el = modal(`<h2>Devices</h2>${d.devices.length ? d.devices.map(x => `<button class="devrow${x.is_active?" on":""}" data-id="${esc(x.id)}"><span>${esc(x.name)}</span><span class="muted small">${esc(x.type)}${x.is_active?" · active":""}</span></button>`).join("") : `<div class="empty">No devices found. Open Spotify on a phone or computer.</div>`}`);
  el.querySelectorAll(".devrow").forEach(b => b.onclick = async () => { await call("PUT", "/me/player", { device_ids: [b.dataset.id], play: true }); el.remove(); setTimeout(poll, 500); });
}
async function showQueue() {
  let q = null; try { q = await api("/me/player/queue"); } catch (e) {}
  const list = q ? [q.currently_playing, ...q.queue].filter(Boolean).slice(0, 30) : [];
  modal(`<h2>Queue</h2><div>${list.length ? list.map((x,i) => rowHtml(i, { t: x.name, s: x.artists?.[0]?.name || "", img: x.album?.images?.[1]?.url, v: i ? "" : "Now", attr: `data-u="${esc(x.uri)}"` })).join("") : `<div class="empty">Queue is empty.</div>`}</div>`);
}
$("#pbar").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a;
  if (a === "toggle") act("PUT", ps && ps.is_playing ? "pause" : "play");
  else if (a === "next") act("POST", "next");
  else if (a === "prev") act("POST", "previous");
  else if (a === "shuffle") act("PUT", `shuffle?state=${!(ps && ps.shuffle_state)}`);
  else if (a === "repeat") act("PUT", `repeat?state=${{off:"context",context:"track",track:"off"}[(ps && ps.repeat_state) || "off"]}`);
  else if (a === "devices") showDevices();
  else if (a === "queue") showQueue();
  else if (a === "like" && likeId) { await call(isLiked ? "DELETE" : "PUT", `/me/tracks?ids=${likeId}`); checkLike(likeId); }
});
$("#psk").oninput  = (e) => { seeking = true; $("#pel").textContent = fmtClock(+e.target.value); e.target.style.setProperty("--progress", `${(+e.target.value / +e.target.max) * 100}%`); };
$("#psk").onchange = async (e) => { await call("PUT", `/me/player/seek?position_ms=${Math.round(e.target.value)}`); seeking = false; setTimeout(poll, 300); };
$("#pvo").oninput  = () => { volDrag = true; };
$("#pvo").onchange = async (e) => { await call("PUT", `/me/player/volume?volume_percent=${e.target.value}`); volDrag = false; };
document.addEventListener("keydown", (e) => {
  if (!ps?.item || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest("input, textarea, select, [contenteditable=true], button, a, [role=button]")) return;
  if (e.code === "Space") {
    e.preventDefault();
    act("PUT", ps.is_playing ? "pause" : "play");
  } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 10000 : -10000;
    const position = Math.max(0, Math.min(ps.item.duration_ms, (ps.progress_ms || 0) + delta));
    call("PUT", `/me/player/seek?position_ms=${position}`).then(() => setTimeout(poll, 300));
  }
});

/* cover clicks (play / queue) */
document.addEventListener("click", (e) => {
  const el = e.target.closest(".cover[data-u], .cover[data-p]");
  if (!el || e.target.closest("#pbar")) return;
  e.stopPropagation();
  const uri = el.dataset.p || el.dataset.u;
  if (e.shiftKey && uri.startsWith("spotify:track:")) enqueue(uri); else play(uri);
}, true);

/* keyboard shortcuts (outside inputs) */
document.addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey) return;
  if (document.querySelector(".ahx")) return; // hero handles its own
  if (e.code === "Space") { e.preventDefault(); act("PUT", ps && ps.is_playing ? "pause" : "play"); }
  else if (e.key === "ArrowRight") act("POST", "next");
  else if (e.key === "ArrowLeft") act("POST", "previous");
});
setInterval(tickBar, 500);
setInterval(() => { if (localStorage.getItem("refresh") && !document.hidden) poll(); }, 4000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && localStorage.getItem("refresh")) poll(); });
if (localStorage.getItem("refresh")) poll();
/* ---------- 11. Tab routing + init ---------- */
$("#tabs").innerHTML = [
  ["wrapped","Overview"],
  ["now","Now"],
  ["track","Tracks"],
  ["artist","Artists"],
  ["album","Albums"],
  ["wrap","Wrapped"],
  ["search","Search"],
  ["library","Library"],
  ["profile","Profile"],
  ["stats","Stats"],
  ["settings","Settings"],
].map(([k,l]) => `<button data-tab="${k}">${l}</button>`).join("");

function render() {
  document.querySelectorAll("#tabs button")
    .forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  clearInterval(nowTimer);

  if (tab === "wrapped")  return renderWrapped();
  if (tab === "now")      return renderNow();
  if (tab === "wrap")     return renderWrap();
  if (tab === "search")   return renderSearch();
  if (tab === "library")  return renderLibrary();
  if (tab === "profile")  return renderProfile();
  if (tab === "stats")    return renderStats();
  if (tab === "settings") return renderSettings();
  return renderTop(); // track / artist / album
}

/* Delegated clicks: row / period-wrap hero with [data-k] → small artist modal.
   Wrapped artist cards are excluded because they have their own
   click → openArtistHero() handler bound in bindArtistCards(). */
document.addEventListener("click", (e) => {
  if (e.target.closest("#pbar, .modal, .ahx, .wrapped-card, .wrapped-grid")) return;
  const row = e.target.closest(".row, .hero");
  if (!row) return;
  const k = row.querySelector("[data-k]");
  if (k) openArtist(k.dataset.k);
});

/* ---------- 12. start / init ---------- */
async function start() {
  $("#login").hidden = true;
  $("#app").hidden = false;

  const saved = await idb.get("lib");
  if (saved) lib = { plays: saved.plays || [], meta: saved.meta || {}, art: saved.art || {} };
  rebuildSeen();
  cache = null;

  $("#tabs").onclick = (e) => {
    const t = e.target.dataset.tab;
    if (t) { tab = t; render(); }
  };

  $("#logoutBtn").onclick = () => {
    ["access", "refresh", "expires", "verifier"].forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  render();
  await syncRecent();
  setInterval(syncRecent, 120000);
}

(async function init() {
  $("#loginBtn").onclick = login;

  if (location.origin + location.pathname !== REDIRECT) {
    $("#loginMsg").textContent = `Open this app at ${REDIRECT} so it matches your Spotify redirect URI.`;
  }

  const code = new URLSearchParams(location.search).get("code");
  if (code) {
    try {
      await tokenRequest({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT,
        code_verifier: localStorage.getItem("verifier"),
      });
    } catch (e) {
      $("#loginMsg").textContent = "Sign in failed. Try again.";
    }
    history.replaceState({}, "", REDIRECT);
  }

  if (localStorage.getItem("refresh")) start();
})();/* ============================================================
   NOW PLAYING — complete self-contained rewrite
   ============================================================ */

/* ---- 1. CSS (injected once) ---- */
(() => {
  if (document.getElementById("nh-style")) return;
  const st = document.createElement("style");
  st.id = "nh-style";
  st.textContent = `
    #np{cursor:pointer;position:relative;transition:transform .2s ease,box-shadow .2s ease}
    #np:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.1)}

    .nhx{position:fixed;inset:0;z-index:90;color:#fff}
    .nhx-bg{position:absolute;inset:0;background:#000;overflow:hidden}
    .nhx-bg .img{position:absolute;inset:-12%;background-size:cover;background-position:center;filter:blur(60px) saturate(200%) brightness(.66);transform:scale(1.15);transition:transform 10s cubic-bezier(.2,.6,.2,1),opacity .85s ease;opacity:0}
    .nhx-bg .img.on{opacity:1}
    .nhx.open .nhx-bg .img{transform:scale(1.35)}
    .nhx-bg .tint{position:absolute;inset:0;background:linear-gradient(145deg,color-mix(in srgb,var(--song) 24%,transparent),transparent 72%);mix-blend-mode:soft-light;opacity:.72}
    .nhx-bg .tint-accent{position:absolute;inset:0;mix-blend-mode:color;opacity:0;transition:opacity .9s ease,background-color .9s ease}
    .nhx-bg .vig{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.2),transparent 20%,transparent 80%,rgba(0,0,0,.3)),radial-gradient(ellipse at 50% 50%,transparent 32%,rgba(0,0,0,.45) 100%)}

    .nhx-body{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:3vw;padding:4vh 4vw;overflow:auto;scrollbar-width:none}
    .nhx-body::-webkit-scrollbar{display:none}

    .nhx-left{width:min(430px,42vw);flex:none;display:flex;flex-direction:column;gap:1rem}
    .nhx-cover{width:100%;aspect-ratio:1;border-radius:24px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);background:rgba(255,255,255,.1)}
    .nhx-cover img{width:100%;height:100%;object-fit:cover;display:block}
    .nhx-cover .ph{width:100%;height:100%;display:grid;place-items:center;font-size:5rem;font-weight:800}

    .nhx-meta{display:flex;flex-direction:column;gap:.2rem}
    .nhx-status{display:flex;align-items:center;gap:.5rem;font-size:.78rem;opacity:.85;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.3rem}
    .nhx-name{font-size:1.9rem;font-weight:800;line-height:1.1;letter-spacing:-.02em;word-break:break-word}
    .nhx-artist{font-size:1.05rem;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nhx-album{font-size:.88rem;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    .nhx-prog{display:flex;align-items:center;gap:.7rem;font-size:.72rem;opacity:.85;font-variant-numeric:tabular-nums;margin-top:.5rem}
    .nhx-prog-bar{flex:1;height:5px;border-radius:5px;background:rgba(255,255,255,.22);overflow:hidden}
    .nhx-prog-bar i{display:block;height:100%;background:#fff;border-radius:5px;transition:width .5s linear}

    .nhx-controls{display:flex;gap:.55rem;align-items:center;justify-content:center;margin-top:.6rem}
    .nhx-controls button{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);color:#fff;display:grid;place-items:center;cursor:pointer;transition:all .18s}
    .nhx-controls button:hover{background:rgba(255,255,255,.26);transform:scale(1.05)}
    .nhx-controls button.on{color:#1DB954;background:rgba(29,185,84,.22);border-color:rgba(29,185,84,.45)}
    .nhx-controls button.primary{width:60px;height:60px;background:#fff;color:#000}
    .nhx-controls button.primary:hover{transform:scale(1.08)}
    .nhx-controls .ico{width:18px;height:18px}
    .nhx-controls button.primary .ico{width:24px;height:24px}

    .nhx-right{width:min(560px,46vw);max-height:88vh;overflow:auto;padding:1.5rem;border-radius:28px;background:rgba(255,255,255,.14);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 20px 60px rgba(0,0,0,.25);scrollbar-width:none}
    .nhx-right::-webkit-scrollbar{display:none}
    .nhx-right h3{font-size:1.4rem;font-weight:800;letter-spacing:-.02em;margin-bottom:.7rem}
    .nhx-right h5{font-size:.78rem;text-transform:uppercase;letter-spacing:.09em;opacity:.7;margin:1.2rem 0 .5rem}
    .nhx-chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem}
    .nhx-chip{background:rgba(255,255,255,.14);border-radius:16px;padding:.8rem .9rem;display:grid;gap:.15rem}
    .nhx-chip b{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
    .nhx-chip span{font-size:.78rem;opacity:.75}
    .nhx-bars{display:flex;align-items:flex-end;gap:3px;height:88px}
    .nhx-bars i{flex:1;height:0%;min-height:2px;background:rgba(255,255,255,.45);border-radius:4px 4px 0 0;transition:height .9s cubic-bezier(.2,.8,.2,1)}
    .nhx-bars i.hi{background:#fff}
    .nhx-lbl{display:flex;justify-content:space-between;font-size:.7rem;opacity:.7;margin-top:.3rem}
    .nhx-queue{display:flex;flex-direction:column;gap:.3rem;max-height:34vh;overflow:auto;scrollbar-width:none}
    .nhx-queue::-webkit-scrollbar{display:none}
    .nhx-q-item{display:flex;align-items:center;gap:.7rem;padding:.4rem .5rem;border-radius:10px;transition:background .15s}
    .nhx-q-item:hover{background:rgba(255,255,255,.09)}
    .nhx-q-item>b{width:1.4rem;opacity:.55;text-align:right;font-size:.82rem}
    .nhx-q-item img,.nhx-q-item .ph{width:38px;height:38px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,.12);flex:none;display:grid;place-items:center;font-weight:700}
    .nhx-q-meta{flex:1;min-width:0;display:grid}
    .nhx-q-meta em{font-style:normal;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.9rem}
    .nhx-q-meta small{opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.76rem}
    .nhx-q-item>span{font-size:.78rem;opacity:.7;font-variant-numeric:tabular-nums}
    .nhx-empty{padding:1rem;text-align:center;opacity:.55;font-size:.88rem}

    .nhx-close{position:fixed;top:1rem;right:1rem;z-index:6;width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,.35);backdrop-filter:blur(10px);color:#fff;display:grid;place-items:center;cursor:pointer;border:0}
    .nhx-close .ico{width:18px;height:18px}

    @media(max-width:900px){
      .nhx-body{flex-direction:column;padding:2rem 4vw;gap:1.2rem;overflow-y:auto}
      .nhx-left{width:min(360px,100%)}
      .nhx-right{width:100%;max-height:none}
      .nhx-name{font-size:1.5rem}
    }
  `;
  document.head.appendChild(st);
})();

/* ---- 2. icons (self-contained) ---- */
const NH_ICONS = {
  play:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>`,
  next:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>`,
  prev:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 18l-8.5-6L18 6v12zM6 6h2v12H6z"/></svg>`,
  shuffle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`,
  repeat:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  close:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
};
const nhIcon = (n) => `<span class="ico">${NH_ICONS[n] || ""}</span>`;

/* ---- 3. dominant color extractor (self-contained) ---- */
const nhColorCache = new Map();
function nhExtractColor(url) {
  if (!url) return Promise.resolve(null);
  if (nhColorCache.has(url)) return Promise.resolve(nhColorCache.get(url));
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        const s = 24; c.width = s; c.height = s;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, s, s);
        const d = g.getImageData(0, 0, s, s).data;
        let best = [29,185,84], bs = -1;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i+3] < 200) continue;
          const r = d[i], gg = d[i+1], b = d[i+2];
          const mx = Math.max(r,gg,b), mn = Math.min(r,gg,b);
          const sat = mx-mn, bright = (r+gg+b)/3;
          if (bright < 25 || bright > 235) continue;
          const score = sat*1.8 + bright*0.25;
          if (score > bs) { bs = score; best = [r,gg,b]; }
        }
        const hex = "#" + best.map(v => v.toString(16).padStart(2,"0")).join("");
        nhColorCache.set(url, hex);
        res(hex);
      } catch (e) { res(null); }
    };
    img.onerror = () => res(null);
    img.src = url;
  });
}

/* ---- 4. per-track stats ---- */
function nhTrackStats(uri) {
  const s = compute();
  const track = s.T.get(uri);
  if (!track) return null;
  const artist = s.A.get(track.m.a) || null;
  const trackRank = s.tracks.findIndex(t => t.uri === uri) + 1;
  const artistRank = artist ? s.artists.findIndex(a => a.name === artist.name) + 1 : 0;
  const plays = lib.plays.filter(p => p[1] === uri);
  const H = Array(24).fill(0);
  plays.forEach(([ts]) => H[new Date(ts).getHours()]++);
  return {
    track, artist, plays: plays.length,
    trackRank, artistRank, totalPlays: s.n,
    trackPct: s.n ? ((track.c / s.n) * 100).toFixed(2) : "0.00",
    firstPlay: plays.length ? Math.min(...plays.map(p => p[0])) : 0,
    H,
  };
}

/* ---- 5. Now tab renderer ---- */
async function renderNow() {
  clearInterval(nowTimer);
  const recent = [...lib.plays].sort((a, b) => b[0] - a[0]).slice(0, 25);
  const view = $("#view");
  const list = recent.map(([ts, uri], i) => {
    const m = lib.meta[uri] || { n: "Unknown", a: "", img: "" };
    return rowHtml(i, { t: m.n, s: m.a, img: m.img, v: ago(ts), uri, attr: `data-u="${esc(uri)}"` }).replace(`<span class="rank">${i + 1}</span>`, "");
  }).join("");

  view.innerHTML = `
    <h2>Now playing</h2>
    <div class="card np" id="np"><div class="empty" style="width:100%">Checking Spotify…</div></div>
    <h3 style="margin-top:.5rem">Recently played</h3>
    <div class="card">${list || '<div class="empty">No plays collected yet.</div>'}</div>`;
  const npEl = $("#np");
  if (npEl) npEl.addEventListener("click", () => openNowHero());

  fillImages(recent.map(([, uri]) => ({ uri, img: lib.meta[uri]?.img })), "track");

  const poll = async () => {
    if (tab !== "now") return;
    let d = null;
    try { d = await api("/me/player/currently-playing"); } catch (e) {}
    const box = $("#np"); if (!box) return;
    if (!d || !d.item) {
      box.innerHTML = `<div class="empty" style="width:100%">Nothing playing. Start a song in Spotify.</div>`;
      tick = null;
      return;
    }
    const t = d.item;
    const img = t.album?.images?.[0]?.url || "";
    tick = { at: Date.now(), prog: d.progress_ms, dur: t.duration_ms, playing: d.is_playing };
    box.innerHTML = `${coverHtml(img, t.name, false, "")}
      <div class="meta">
        <div class="status"><span class="bars${d.is_playing ? "" : " paused"}"><i></i><i></i><i></i><i></i></span>${d.is_playing ? "Playing" : "Paused"}</div>
        <div class="t">${esc(t.name)}</div>
        <div class="s">${esc(t.artists.map(a => a.name).join(", "))}</div>
        <div class="s">${esc(t.album.name)}</div>
        <div class="prog"><i id="progBar" style="width:${(d.progress_ms / t.duration_ms) * 100}%"></i></div>
      </div>`;
  };

  await poll();

  let n = 0;
  nowTimer = setInterval(() => {
    n++;
    if (n % 5 === 0) poll();
    if (n % 30 === 0) syncRecent();
    const bar = $("#progBar");
    if (bar && tick && tick.playing) bar.style.width = `${Math.min(100, ((tick.prog + Date.now() - tick.at) / tick.dur) * 100)}%`;
  }, 1000);
}

async function openNowHero() {
  if (document.querySelector(".nhx")) return;

  let cur = null;
  try { cur = await api("/me/player"); } catch (e) { toast("Can't reach Spotify"); return; }
  if (!cur || !cur.item) { toast("Nothing playing right now"); return; }

  /* --- shell (built once, stays mounted for the whole session) --- */
  const overlay = document.createElement("div");
  overlay.className = "nhx";
  overlay.innerHTML = `
    <div class="nhx-bg">
      <div class="img"></div>
      <div class="img"></div>
      <div class="tint"></div>
      <div class="tint-accent"></div>
      <div class="vig"></div>
    </div>
    <div class="nhx-body">
      <div class="nhx-left" id="nhx-left"></div>
      <div class="nhx-right" id="nhx-right"></div>
    </div>
    <button class="nhx-close" aria-label="Close">${nhIcon("close")}</button>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("open"));

  if (cfg.anim && typeof anime !== "undefined") {
    anime({ targets: overlay, opacity: [0, 1], duration: 300, easing: "easeOutQuad" });
  }

  const state = {
    cur,
    curId: cur.item.id,
    dur: cur.item.duration_ms,
    lastAt: Date.now(),
    lastProg: cur.progress_ms,
    isPlaying: cur.is_playing,
    swapping: false,
  };

  const leftEl = overlay.querySelector("#nhx-left");
  const rightEl = overlay.querySelector("#nhx-right");
  const bgLayers = overlay.querySelectorAll(".nhx-bg .img");
  let bgToggle = 0;

  /* --- HTML builders --- */
  function leftHTML(c, t) {
    const img = t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || "";
    return `
      <div class="nhx-cover">${img ? `<img src="${esc(img)}" alt="">` : `<div class="ph">${esc((t.name || "?")[0])}</div>`}</div>
      <div class="nhx-meta">
        <div class="nhx-status">
          <span class="bars${c.is_playing ? "" : " paused"}"><i></i><i></i><i></i><i></i></span>
          <span class="nhx-status-txt">${c.is_playing ? "Playing" : "Paused"}</span>
        </div>
        <div class="nhx-name">${esc(t.name)}</div>
        <div class="nhx-artist">${esc(t.artists?.map(a => a.name).join(", ") || "")}</div>
        <div class="nhx-album">${esc(t.album?.name || "")}</div>
      </div>
      <div class="nhx-prog">
        <span id="nhx-el">${fmtClock(c.progress_ms)}</span>
        <div class="nhx-prog-bar"><i id="nhx-bar" style="width:${(c.progress_ms / t.duration_ms) * 100}%"></i></div>
        <span>${fmtClock(t.duration_ms)}</span>
      </div>
      <div class="nhx-controls">
        <button data-nh="shuffle" class="${c.shuffle_state ? "on" : ""}" aria-label="Shuffle">${nhIcon("shuffle")}</button>
        <button data-nh="prev" aria-label="Previous">${nhIcon("prev")}</button>
        <button class="primary" data-nh="toggle" aria-label="Play / pause">${nhIcon(c.is_playing ? "pause" : "play")}</button>
        <button data-nh="next" aria-label="Next">${nhIcon("next")}</button>
        <button data-nh="repeat" class="${c.repeat_state !== "off" ? "on" : ""}" aria-label="Repeat">${nhIcon("repeat")}</button>
      </div>`;
  }

  function rightHTML(t, queue) {
    const stats = nhTrackStats(t.uri);
    let chipsHtml = "";
    if (stats) {
      const chips = [
        [stats.plays, "your plays"],
        [stats.trackRank > 0 && stats.trackRank <= 100 ? `#${stats.trackRank}` : "—", "track rank"],
        [stats.artistRank > 0 && stats.artistRank <= 100 ? `#${stats.artistRank}` : "—", "artist rank"],
        [`${stats.trackPct}%`, "of your total"],
        [stats.artist ? fmtNum(stats.artist.c) : "—", "artist plays"],
        [fmtDur(stats.track.ms), "time with it"],
        [stats.firstPlay ? fd(stats.firstPlay) : "—", "first heard"],
      ];
      chipsHtml = `<div class="nhx-chips">${chips.map(([v, l]) =>
        `<div class="nhx-chip"><b${typeof v === "number" ? ` data-n="${v}"` : ""}>${typeof v === "number" ? fmtNum(v) : esc(String(v))}</b><span>${l}</span></div>`
      ).join("")}</div>`;
    }
    let barsHtml = "";
    if (stats) {
      const hMax = Math.max(1, ...stats.H);
      const peak = stats.H.indexOf(Math.max(...stats.H));
      const lbl = (h) => h === 0 ? "12a" : h === 6 ? "6a" : h === 12 ? "12p" : h === 18 ? "6p" : h === 23 ? "11p" : "";
      barsHtml = `<h5>When you play it</h5>
        <div class="nhx-bars">${stats.H.map((v, k) =>
          `<i class="${k === peak ? "hi" : ""}" data-h="${Math.round((v / hMax) * 100)}" title="${lbl(k) || (k + ":00")} · ${v} plays"></i>`
        ).join("")}</div>
        <div class="nhx-lbl"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>`;
    }
    const queueHtml = queue.length
      ? queue.map((x, i) => {
          const qImg = x.album?.images?.[1]?.url || x.album?.images?.[0]?.url || "";
          const artists = x.artists?.map(a => a.name).join(", ") || "";
          return `<div class="nhx-q-item"><b>${i + 1}</b>${qImg
            ? `<img src="${esc(qImg)}" alt="" loading="lazy">`
            : `<div class="ph">${esc((x.name || "?")[0])}</div>`}
            <div class="nhx-q-meta"><em>${esc(x.name)}</em><small>${esc(artists)}</small></div>
            <span>${fmtClock(x.duration_ms)}</span></div>`;
        }).join("")
      : `<div class="nhx-empty">Queue is empty.</div>`;
    return `
      <h3>Now playing</h3>
      ${chipsHtml || `<div class="nhx-empty">Track hasn't been played enough to rank yet — keep listening.</div>`}
      ${barsHtml}
      <h5>Up next · ${queue.length} in queue</h5>
      <div class="nhx-queue">${queueHtml}</div>`;
  }

  /* --- background crossfade --- */
  function updateBg(t) {
    const img = t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || "";
    if (!img) return;
    const next = bgLayers[bgToggle % 2];
    const prev = bgLayers[(bgToggle + 1) % 2];
    next.style.backgroundImage = `url('${esc(img)}')`;
    next.classList.add("on");
    prev.classList.remove("on");
    bgToggle++;
    nhExtractColor(img).then(col => {
      if (!col) return;
      const acc = overlay.querySelector(".tint-accent");
      if (acc) { acc.style.backgroundColor = col; acc.style.opacity = "0.28"; }
    });
  }

  /* --- entrance animation for a freshly populated panel --- */
  function animIn() {
    if (!cfg.anim || typeof anime === "undefined") {
      overlay.querySelectorAll(".nhx-bars i").forEach(el => el.style.height = `${el.dataset.h}%`);
      overlay.querySelectorAll("[data-n]").forEach(el => countUp(el, +el.dataset.n));
      return;
    }
    anime({ targets: overlay.querySelectorAll(".nhx-cover"), scale: [0.9, 1], opacity: [0, 1], duration: 500, easing: "easeOutExpo" });
    anime({ targets: overlay.querySelectorAll(".nhx-meta > *"), translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(60, { start: 100 }), duration: 500, easing: "easeOutExpo" });
    anime({ targets: overlay.querySelectorAll(".nhx-prog"), opacity: [0, 1], delay: 250, duration: 400 });
    anime({ targets: overlay.querySelectorAll(".nhx-controls button"), scale: [0.4, 1], opacity: [0, 1], delay: anime.stagger(50, { start: 300 }), duration: 400, easing: "easeOutBack" });
    anime({ targets: overlay.querySelectorAll(".nhx-right > *"), translateY: [12, 0], opacity: [0, 1], delay: anime.stagger(50, { start: 100 }), duration: 400, easing: "easeOutExpo" });
    anime({ targets: overlay.querySelectorAll(".nhx-chip"), scale: [0.7, 1], opacity: [0, 1], delay: anime.stagger(45, { start: 300 }), duration: 450, easing: "easeOutBack" });
    anime({ targets: overlay.querySelectorAll(".nhx-bars i"), height: (el) => `${el.dataset.h}%`, delay: anime.stagger(15, { start: 450 }), duration: 700, easing: "easeOutElastic(1,.7)" });
    anime({ targets: overlay.querySelectorAll(".nhx-q-item"), translateX: [24, 0], opacity: [0, 1], delay: anime.stagger(35, { start: 500 }), duration: 400 });
    overlay.querySelectorAll("[data-n]").forEach(el => countUp(el, +el.dataset.n));
  }

  /* --- populate / swap content --- */
  async function fill(mode) {
    if (state.swapping) return;
    state.swapping = true;
    try {
      const c = state.cur;
      const t = c.item;

      /* fade out + fetch queue in parallel */
      const fading = mode === "swap" && cfg.anim && typeof anime !== "undefined"
        ? anime({ targets: [leftEl, rightEl], opacity: [1, 0], duration: 200, easing: "easeInQuad" }).finished
        : Promise.resolve();
      const queueFetch = api("/me/player/queue")
        .then(q => (q?.queue || []).filter(Boolean).slice(0, 30))
        .catch(() => []);
      const [, queue] = await Promise.all([fading, queueFetch]);

      /* replace content */
      leftEl.innerHTML = leftHTML(c, t);
      rightEl.innerHTML = rightHTML(t, queue);

      /* keep container invisible if we faded it out; animIn will fade the children */
      if (mode === "swap") {
        leftEl.style.opacity = "0";
        rightEl.style.opacity = "0";
      } else {
        leftEl.style.opacity = "";
        rightEl.style.opacity = "";
      }

      updateBg(t);
      animIn();

      /* fade the containers back in after swap */
      if (mode === "swap" && cfg.anim && typeof anime !== "undefined") {
        anime({ targets: leftEl, opacity: [0, 1], duration: 400, easing: "easeOutQuad" });
        anime({ targets: rightEl, opacity: [0, 1], duration: 400, easing: "easeOutQuad" });
      }
    } finally {
      state.swapping = false;
    }
  }

  /* --- progress ticker --- */
  const tickBar = () => {
    if (!overlay.isConnected) return;
    const p = Math.min(state.dur, state.lastProg + (state.isPlaying ? Date.now() - state.lastAt : 0));
    const bar = overlay.querySelector("#nhx-bar");
    const el = overlay.querySelector("#nhx-el");
    if (bar) bar.style.width = `${(p / state.dur) * 100}%`;
    if (el) el.textContent = fmtClock(p);
  };
  const progressInt = setInterval(tickBar, 500);

  /* --- unified update handler --- */
  async function handlePlayerUpdate(d) {
    if (!d || !d.item) return;

    /* track changed → smooth swap, no close/reopen */
    if (d.item.id !== state.curId) {
      state.cur = d;
      state.curId = d.item.id;
      state.dur = d.item.duration_ms;
      state.lastAt = Date.now();
      state.lastProg = d.progress_ms;
      state.isPlaying = d.is_playing;
      await fill("swap");
      return;
    }

    /* same track → just sync controls + progress */
    state.cur = d;
    state.isPlaying = d.is_playing;
    state.lastAt = Date.now();
    state.lastProg = d.progress_ms;
    if (d.item.duration_ms) state.dur = d.item.duration_ms;

    const pp = overlay.querySelector('[data-nh="toggle"]');
    if (pp) pp.innerHTML = nhIcon(state.isPlaying ? "pause" : "play");
    const sh = overlay.querySelector('[data-nh="shuffle"]');
    if (sh) sh.classList.toggle("on", !!d.shuffle_state);
    const rp = overlay.querySelector('[data-nh="repeat"]');
    if (rp) rp.classList.toggle("on", d.repeat_state !== "off");
    const st = overlay.querySelector(".nhx-status");
    if (st) {
      st.querySelector(".bars")?.classList.toggle("paused", !state.isPlaying);
      const txt = st.querySelector(".nhx-status-txt");
      if (txt) txt.textContent = state.isPlaying ? "Playing" : "Paused";
    }
  }

  /* --- background poller (every 3s) --- */
  const stateInt = setInterval(async () => {
    if (!overlay.isConnected) { clearInterval(stateInt); return; }
    try {
      const d = await api("/me/player");
      if (d) await handlePlayerUpdate(d);
    } catch (e) {}
  }, 3000);

  /* --- control clicks --- */
  overlay.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-nh]");
    if (b) {
      const a = b.dataset.nh;
      const c = state.cur;
      if (a === "toggle") await act("PUT", c.is_playing ? "pause" : "play");
      else if (a === "next") await act("POST", "next");
      else if (a === "prev") await act("POST", "previous");
      else if (a === "shuffle") await act("PUT", `shuffle?state=${!c.shuffle_state}`);
      else if (a === "repeat") await act("PUT", `repeat?state=${{ off: "context", context: "track", track: "off" }[c.repeat_state || "off"]}`);
      /* immediately re-check player state so next/prev swaps fast */
      setTimeout(async () => {
        try {
          const d = await api("/me/player");
          if (d) await handlePlayerUpdate(d);
        } catch (err) {}
      }, 450);
      return;
    }
    if (e.target === overlay) close();
  });

  /* --- close --- */
  const onKey = (e) => { if (e.key === "Escape") close(); };
  function close() {
    clearInterval(progressInt);
    clearInterval(stateInt);
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (cfg.anim && typeof anime !== "undefined") {
      anime({ targets: overlay, opacity: [1, 0], duration: 280, easing: "easeInQuad", complete: () => overlay.remove() });
    } else {
      overlay.remove();
    }
  }
  overlay.querySelector(".nhx-close").onclick = close;
  document.addEventListener("keydown", onKey);

  /* --- initial fill --- */
  await fill("initial");
}