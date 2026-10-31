const SWATCHES = ["#ff8800", "#ff375f", "#bf5af2", "#0a84ff", "#30d158", "#ffd60a", "#64d2ff", "#ff6482"];
let cfg = Object.assign({ mode: "auto", accent: "#ff8800", anim: true, goal: 90 }, JSON.parse(localStorage.getItem("cfg") || "{}"));
let cache = null;
let me;

function applyCfg() {
  const r = document.documentElement;
  if (cfg.mode === "auto") r.removeAttribute("data-theme"); else r.dataset.theme = cfg.mode;
  r.style.setProperty("--accent", cfg.accent);
  r.classList.toggle("noanim", !cfg.anim);
  localStorage.setItem("cfg", JSON.stringify(cfg));
}
applyCfg();

$("#tabs").innerHTML = [["wrapped", "Overview"], ["now", "Now"], ["track", "Tracks"], ["artist", "Artists"], ["album", "Albums"], ["profile", "Profile"], ["stats", "Library"], ["settings", "Settings"]].map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join("");
tab = "wrapped";

const dkey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dn = (k) => { const [y, m, d] = k.split("-"); return Date.UTC(y, m - 1, d) / DAY; };
const dlabel = (k) => new Date(dn(k) * DAY).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

function compute() {
  if (cache && cache.n === lib.plays.length) return cache;
  const A = new Map(), T = new Map(), L = new Map(), D = new Map(), M = new Map(), H = Array(24).fill(0);
  let ms = 0;
  for (const [ts, uri, d] of lib.plays) {
    const m = lib.meta[uri];
    if (!m) continue;
    ms += d;
    let a = A.get(m.a);
    if (!a) { a = { name: m.a, c: 0, ms: 0, t: new Map(), first: ts, last: ts }; A.set(m.a, a); }
    a.c++; a.ms += d; a.first = Math.min(a.first, ts); a.last = Math.max(a.last, ts); a.t.set(uri, (a.t.get(uri) || 0) + 1);
    let t = T.get(uri);
    if (!t) { t = { uri, m, c: 0, ms: 0 }; T.set(uri, t); }
    t.c++; t.ms += d;
    const lk = `${m.al}|${m.a}`;
    let l = L.get(lk);
    if (!l) { l = { name: m.al || "Unknown album", artist: m.a, uri, c: 0, ms: 0 }; L.set(lk, l); }
    l.c++; l.ms += d;
    const k = dkey(ts);
    let dd = D.get(k);
    if (!dd) { dd = { k, c: 0, ms: 0, t: new Map() }; D.set(k, dd); }
    dd.c++; dd.ms += d; dd.t.set(uri, (dd.t.get(uri) || 0) + 1);
    const mk = k.slice(0, 7);
    M.set(mk, (M.get(mk) || 0) + d);
    H[new Date(ts).getHours()]++;
  }
  const by = (x) => [...x.values()].sort((a, b) => b.c - a.c || b.ms - a.ms);
  const days = [...D.keys()].map(dn).sort((a, b) => a - b);
  const set = new Set(days);
  let best = days.length ? 1 : 0, run = 1;
  for (let i = 1; i < days.length; i++) { run = days[i] === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
  const today = dn(dkey(Date.now()));
  let cur = 0, p = set.has(today) ? today : today - 1;
  while (set.has(p)) { cur++; p--; }
  const peak = [...D.values()].sort((a, b) => b.ms - a.ms)[0];
  const s = { n: lib.plays.length, ms, A, T, L, D, M, H, artists: by(A), tracks: by(T), albums: by(L), best, cur, peak, first: lib.plays.length ? Math.min(...lib.plays.map((x) => x[0])) : 0 };
  const hrs = ms / 36e5;
  s.xp = Math.round(hrs * 10 + s.n);
  s.level = Math.floor(Math.sqrt(s.xp / 25)) + 1;
  s.lo = 25 * (s.level - 1) ** 2;
  s.hi = 25 * s.level ** 2;
  s.badges = [
    ["🌙", "Night Owl", "20%+ of plays after 10 PM", (H.slice(22).reduce((a, b) => a + b, 0) + H.slice(0, 4).reduce((a, b) => a + b, 0)) / Math.max(1, s.n) > 0.2],
    ["🌅", "Early Bird", "15%+ of plays 5 to 9 AM", H.slice(5, 9).reduce((a, b) => a + b, 0) / Math.max(1, s.n) > 0.15],
    ["🔥", "On Fire", "7 day streak", best >= 7],
    ["⚡", "Unstoppable", "30 day streak", best >= 30],
    ["💯", "Repeat Offender", "A song played 100 times", s.tracks[0]?.c >= 100],
    ["❤️", "Loyalist", "An artist played 500 times", s.artists[0]?.c >= 500],
    ["🧭", "Explorer", "250 different artists", A.size >= 250],
    ["🌍", "Globetrotter", "1,000 different artists", A.size >= 1000],
    ["🎧", "Marathoner", "Over 8 hours in a day", (peak?.ms || 0) >= 288e5],
    ["🏆", "10K Club", "10,000 plays", s.n >= 10000],
    ["⏳", "100 Days", "100 days of music", ms >= 100 * DAY],
    ["👑", "Super Fan", "An artist with 1,000 plays", s.artists[0]?.c >= 1000]
  ];
  cache = s;
  return s;
}

function countUp() {
  document.querySelectorAll("[data-n]").forEach((el) => {
    const to = +el.dataset.n, d = +(el.dataset.d || 0);
    const fmt = (x) => x.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
    if (!cfg.anim) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const f = (t) => { const q = Math.min(1, (t - t0) / 1100); el.textContent = fmt(to * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });
}

function reveal() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll("[data-w]").forEach((e) => (e.style.width = `${e.dataset.w}%`));
    document.querySelectorAll("[data-h]").forEach((e) => (e.style.height = `${e.dataset.h}%`));
    document.querySelectorAll("[data-off]").forEach((e) => (e.style.strokeDashoffset = e.dataset.off));
    countUp();
  }));
}

function ring(r, pct, color) {
  const c = 2 * Math.PI * r;
  return `<circle cx="60" cy="60" r="${r}" stroke="${color}" stroke-opacity=".18" stroke-width="10"/><circle class="fg" cx="60" cy="60" r="${r}" stroke="${color}" stroke-width="10" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - Math.min(1, pct))}"/>`;
}

function emptyState() {
  $("#view").innerHTML = `<h2>Nothing to show yet</h2><div class="card pad"><p class="muted">Import your extended streaming history to unlock your all-time stats, or keep this tab open to start collecting plays.</p><div class="actions"><button class="btn primary" id="goLib">Import history</button></div></div>`;
  $("#goLib").onclick = () => { tab = "stats"; render(); };
}

function artistRow(a, i, max) {
  return `<div class="row" style="cursor:pointer"><span class="rank">${i + 1}</span>${coverHtml(lib.art[a.name] || "", a.name, true, `data-k="${esc(a.name)}"`)}<div class="meta"><div class="t">${esc(a.name)}</div><div class="bar"><i data-w="${(a.c / max) * 100}"></i></div></div><div class="v"><b>${fmtNum(a.c)}</b><br>${fmtDur(a.ms)}</div></div>`;
}

function renderWrapped() {
  clearInterval(nowTimer);
  const s = compute();
  if (!s.n) return emptyState();
  const a0 = s.artists[0], t0 = s.tracks[0], l0 = s.albums[0];
  const mins = s.ms / 6e4;
  const todayMin = (s.D.get(dkey(Date.now()))?.ms || 0) / 6e4;
  const months = [...s.M.entries()].sort().slice(-36);
  const mmax = Math.max(1, ...months.map((m) => m[1]));
  const hmax = Math.max(1, ...s.H);
  const now = new Date();
  const start = dn(dkey(now)) - (52 * 7 + now.getDay());
  const cells = [];
  let hm = 1;
  for (let i = 0; i < 371; i++) { const v = s.D.get(new Date((start + i) * DAY).toISOString().slice(0, 10))?.ms || 0; hm = Math.max(hm, v); cells.push(v); }
  const heat = cells.map((v, i) => (start + i > dn(dkey(now)) ? `<i class="x"></i>` : `<i style="--l:${v ? 0.25 + 0.75 * (v / hm) : 0}"></i>`)).join("");
  const peakT = s.peak && [...s.peak.t.entries()].sort((a, b) => b[1] - a[1])[0];
  const feat = (k, cover, t, sub, n) => `<div class="feat">${cover}<div><div class="k">${k}</div><div class="t">${esc(t)}</div><div class="s">${esc(sub)}</div><div class="n">${n}</div></div></div>`;
  $("#view").innerHTML = `
    <section class="hero"><div><div class="hl">Your all-time #1 artist</div><h1>${esc(a0.name)}</h1>
      <div class="hs"><b data-n="${a0.c}">0</b> plays · <b data-n="${Math.round(a0.ms / 6e4)}">0</b> minutes</div>
      <div class="hr">${((a0.c / s.n) * 100).toFixed(1)}% of everything you've played, out of ${fmtNum(s.A.size)} artists</div></div>
      ${coverHtml(lib.art[a0.name] || "", a0.name, true, `data-k="${esc(a0.name)}"`)}</section>
    <div class="g4">
      <div class="big"><b data-n="${Math.round(mins)}">0</b><span>Minutes listened</span></div>
      <div class="big"><b data-n="${Math.round(s.ms / 36e5)}">0</b><span>Hours listened</span></div>
      <div class="big"><b data-n="${(s.ms / DAY).toFixed(1)}" data-d="1">0</b><span>Days of music</span></div>
      <div class="big"><b data-n="${(s.ms / (365 * DAY)).toFixed(2)}" data-d="2">0</b><span>Years listened</span></div>
    </div>
    <div class="g2">
      ${feat("Top song of all time", coverHtml(t0.m.img, t0.m.n, false, `data-u="${esc(t0.uri)}"`), t0.m.n, t0.m.a, `${fmtNum(t0.c)} plays · ${fmtDur(t0.ms)}`)}
      ${feat("Top album of all time", coverHtml(lib.meta[l0.uri]?.img, l0.name, false, `data-u="${esc(l0.uri)}"`), l0.name, l0.artist, `${fmtNum(l0.c)} plays · ${fmtDur(l0.ms)}`)}
      ${feat("Biggest listening day", `<div class="cover" style="font-size:2rem">📅</div>`, dlabel(s.peak.k), peakT ? `Most played: ${lib.meta[peakT[0]]?.n} (${peakT[1]}×)` : "", `${fmtDur(s.peak.ms)} · ${fmtNum(s.peak.c)} plays`)}
      ${feat("Longest streak", `<div class="cover" style="font-size:2rem">🔥</div>`, `${s.best} days in a row`, `Current streak: ${s.cur} days`, `Listening since ${new Date(s.first).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`)}
    </div>
    <div class="g2">
      <div class="card pad rings"><svg viewBox="0 0 120 120">${ring(52, todayMin / cfg.goal, "#ff375f")}${ring(38, s.cur / 30, "#30d158")}${ring(24, (s.xp - s.lo) / (s.hi - s.lo), "#64d2ff")}</svg>
        <div class="rl"><div><i style="background:#ff375f"></i>Today <b>${Math.round(todayMin)}</b> / ${cfg.goal} min</div><div><i style="background:#30d158"></i>Streak <b>${s.cur}</b> / 30 days</div><div><i style="background:#64d2ff"></i>Level <b>${Math.round(((s.xp - s.lo) / (s.hi - s.lo)) * 100)}%</b> to ${s.level + 1}</div></div></div>
      <div class="card pad lvl"><div class="muted small">Level</div><div class="n">${s.level}</div><div><b>${["Newcomer", "Listener", "Regular", "Enthusiast", "Audiophile", "Superfan", "Legend", "Icon"][Math.min(7, Math.floor((s.level - 1) / 3))]}</b></div><div class="xp"><i data-w="${((s.xp - s.lo) / (s.hi - s.lo)) * 100}"></i></div><div class="muted small">${fmtNum(s.xp)} XP · ${fmtNum(s.hi - s.xp)} to level ${s.level + 1}</div></div>
    </div>
    <h3 style="margin-bottom:-.5rem">Top 10 artists</h3>
    <div class="card">${s.artists.slice(0, 10).map((a, i) => artistRow(a, i, a0.c)).join("")}</div>
    <div class="g2">
      <div><h3>Top 10 tracks</h3><div class="card">${s.tracks.slice(0, 10).map((t, i) => rowHtml(i, { t: t.m.n, s: t.m.a, img: t.m.img, v: `${fmtNum(t.c)} plays`, attr: `data-u="${esc(t.uri)}"` })).join("")}</div></div>
      <div><h3>Top 10 albums</h3><div class="card">${s.albums.slice(0, 10).map((l, i) => rowHtml(i, { t: l.name, s: l.artist, img: lib.meta[l.uri]?.img, v: `${fmtNum(l.c)} plays`, attr: `data-u="${esc(l.uri)}"` })).join("")}</div></div>
    </div>
    <div class="card pad"><h3>Past year</h3><div class="heat">${heat}</div></div>
    <div class="card pad"><h3>Hours listened per month</h3><div class="chart">${months.map(([k, v]) => `<div data-h="${(v / mmax) * 100}" title="${k}: ${Math.round(v / 36e5)} hrs"></div>`).join("")}</div><div class="axis"><span>${months[0]?.[0] || ""}</span><span>${months[months.length - 1]?.[0] || ""}</span></div></div>
    <div class="card pad"><h3>When you listen</h3><div class="chart">${s.H.map((v, h) => `<div data-h="${(v / hmax) * 100}" title="${h}:00 · ${fmtNum(v)} plays"></div>`).join("")}</div><div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>`;
  fillImages([{ uri: t0.uri, img: t0.m.img }, { uri: l0.uri, img: lib.meta[l0.uri]?.img }, ...s.tracks.slice(0, 10).map((t) => ({ uri: t.uri, img: t.m.img })), ...s.albums.slice(0, 10).map((l) => ({ uri: l.uri, img: lib.meta[l.uri]?.img }))], "track");
  fillImages(s.artists.slice(0, 10).map((a) => ({ t: a.name, img: lib.art[a.name] })), "artist");
  reveal();
}

async function renderProfile() {
  clearInterval(nowTimer);
  const s = compute();
  if (me === undefined) { try { me = await api("/me"); } catch (e) { me = null; } }
  const name = me?.display_name || "You";
  const img = me?.images?.[0]?.url || "";
  const night = s.n ? (s.H.slice(22).reduce((a, b) => a + b, 0) + s.H.slice(0, 4).reduce((a, b) => a + b, 0)) / s.n : 0;
  const morn = s.n ? s.H.slice(5, 9).reduce((a, b) => a + b, 0) / s.n : 0;
  const persona = night > 0.25 ? "Night Owl" : morn > 0.2 ? "Early Bird" : s.artists[0] && s.artists[0].c / Math.max(1, s.n) > 0.08 ? "Die-hard Fan" : "All-day Listener";
  const got = s.badges.filter((b) => b[3]).length;
  $("#view").innerHTML = `
    <div class="card pad prof">${coverHtml(img, name, true, "")}<div><h2>${esc(name)}</h2><div class="muted">${persona}${s.n ? ` · Level ${s.level} · ${fmtNum(s.xp)} XP` : ""}</div>${me?.followers ? `<div class="muted small">${fmtNum(me.followers.total)} followers on Spotify</div>` : ""}</div></div>
    ${s.n ? `<div class="g4">
      <div class="big"><b data-n="${s.n}">0</b><span>Plays</span></div>
      <div class="big"><b data-n="${s.A.size}">0</b><span>Artists</span></div>
      <div class="big"><b data-n="${s.T.size}">0</b><span>Tracks</span></div>
      <div class="big"><b data-n="${s.best}">0</b><span>Best streak (days)</span></div></div>` : ""}
    <h3 style="margin-bottom:-.5rem">Achievements · ${got} of ${s.badges.length}</h3>
    <div class="card pad"><div class="badges">${s.badges.map(([e, t, d, ok]) => `<div class="badge${ok ? "" : " off"}"><em>${e}</em><b>${t}</b><span>${d}</span></div>`).join("")}</div></div>`;
  reveal();
}

function renderSettings() {
  clearInterval(nowTimer);
  $("#view").innerHTML = `<h2>Settings</h2><div class="card pad">
    <div class="set"><div>Appearance<small>Match your device or pick one</small></div><div class="seg sm" id="modeSeg">${["auto", "light", "dark"].map((m) => `<button data-m="${m}" class="${cfg.mode === m ? "on" : ""}">${m[0].toUpperCase() + m.slice(1)}</button>`).join("")}</div></div>
    <div class="set"><div>Accent color<small>Drives charts, rings and the overview</small></div><div class="sws" id="sws">${SWATCHES.map((c) => `<button class="sw${cfg.accent === c ? " on" : ""}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}<input type="color" id="pick" value="${cfg.accent}"></div></div>
    <div class="set"><div>Animations<small>Count-ups, bars and rings</small></div><button class="sw2${cfg.anim ? " on" : ""}" id="animT" aria-label="Toggle animations"></button></div>
    <div class="set"><div>Daily goal<small>Minutes for your Today ring</small></div><input type="number" id="goal" min="10" max="1440" value="${cfg.goal}"></div>
  </div>`;
  $("#modeSeg").onclick = (e) => { if (e.target.dataset.m) { cfg.mode = e.target.dataset.m; applyCfg(); renderSettings(); } };
  $("#sws").onclick = (e) => { if (e.target.dataset.c) { cfg.accent = e.target.dataset.c; applyCfg(); renderSettings(); } };
  $("#pick").oninput = (e) => { cfg.accent = e.target.value; applyCfg(); };
  $("#pick").onchange = renderSettings;
  $("#animT").onclick = () => { cfg.anim = !cfg.anim; applyCfg(); renderSettings(); };
  $("#goal").onchange = (e) => { cfg.goal = Math.max(10, +e.target.value || 90); applyCfg(); };
}

function openArtist(name) {
  const s = compute();
  const a = s.A.get(name);
  if (!a) return;
  const rank = s.artists.findIndex((x) => x.name === name) + 1;
  const songs = [...a.t.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
  const d = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `<div class="sheet"><div class="top">${coverHtml(lib.art[name] || "", name, true, "")}<div><h2>${esc(name)}</h2><div class="muted">Rank #${rank} of ${fmtNum(s.A.size)} artists</div></div></div>
    <div class="g4"><div class="big"><b>${fmtNum(a.c)}</b><span>Plays</span></div><div class="big"><b>${fmtDur(a.ms)}</b><span>Listened</span></div></div>
    <div class="muted small">First played ${d(a.first)} · Last played ${d(a.last)} · ${((a.c / s.n) * 100).toFixed(1)}% of all plays</div>
    <div><h3>Most played songs</h3>${songs.map(([u, c], i) => rowHtml(i, { t: lib.meta[u]?.n || "Unknown", s: lib.meta[u]?.al || "", img: lib.meta[u]?.img, v: `${fmtNum(c)} plays`, attr: "" })).join("")}</div>
    <button class="btn" id="closeM">Close</button></div>`;
  const close = () => { el.remove(); document.removeEventListener("keydown", esc2); };
  const esc2 = (e) => { if (e.key === "Escape") close(); };
  el.onclick = (e) => { if (e.target === el) close(); };
  document.body.appendChild(el);
  $("#closeM").onclick = close;
  document.addEventListener("keydown", esc2);
}

document.addEventListener("click", (e) => {
  const row = e.target.closest(".row, .hero");
  const k = row && row.querySelector("[data-k]");
  if (k && !e.target.closest(".modal")) openArtist(k.dataset.k);
});

function render() {
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  if (tab === "wrapped") renderWrapped();
  else if (tab === "now") renderNow();
  else if (tab === "profile") renderProfile();
  else if (tab === "settings") renderSettings();
  else if (tab === "stats") renderStats();
  else renderTop();
}
function renderWrapped() {
  clearInterval(nowTimer);
  const s = compute();
  if (!s.n) return emptyState();
  const a0 = s.artists[0], t0 = s.tracks[0], l0 = s.albums[0];
  const mins = s.ms / 6e4;
  const todayMin = (s.D.get(dkey(Date.now()))?.ms || 0) / 6e4;
  const months = [...s.M.entries()].sort().slice(-36);
  const mmax = Math.max(1, ...months.map((m) => m[1]));
  const hmax = Math.max(1, ...s.H);
  const now = new Date();
  const start = dn(dkey(now)) - (52 * 7 + now.getDay());
  const cells = [];
  let hm = 1;
  for (let i = 0; i < 371; i++) { const v = s.D.get(new Date((start + i) * DAY).toISOString().slice(0, 10))?.ms || 0; hm = Math.max(hm, v); cells.push(v); }
  const heat = cells.map((v, i) => (start + i > dn(dkey(now)) ? `<i class="x"></i>` : `<i style="--l:${v ? 0.25 + 0.75 * (v / hm) : 0}"></i>`)).join("");
  const peakT = s.peak && [...s.peak.t.entries()].sort((a, b) => b[1] - a[1])[0];
  const feat = (k, cover, t, sub, n) => `<div class="feat glass">${cover}<div><div class="k">${k}</div><div class="t">${esc(t)}</div><div class="s">${esc(sub)}</div><div class="n">${n}</div></div></div>`;

  // Generate Wrapped Cards (Matches your image)
  const cardColors = [
    "linear-gradient(145deg, #1DB954, #15823b)", // Green
    "linear-gradient(145deg, #FF4B72, #c42a4f)", // Pink/Red
    "linear-gradient(145deg, #E63946, #b3242f)", // Red
    "linear-gradient(145deg, #8E44AD, #662d82)", // Purple
    "linear-gradient(145deg, #F4D03F, #c9a728)"  // Yellow
  ];
  
  const topArtists = s.artists.slice(0, 4);
  const cardsHtml = topArtists.map((a, i) => `
    <div class="wrapped-card" style="background: ${cardColors[i % cardColors.length]};">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.455 17.338c-.218.363-.686.478-1.05.26-2.908-1.777-6.573-2.178-10.882-1.194-.415.096-.83-.166-.925-.58-.096-.416.166-.83.58-.926 4.71-1.077 8.753-.623 11.98 1.34.365.218.48.686.263 1.05zm1.456-3.24c-.273.444-.854.586-1.297.31-3.326-2.044-8.395-2.634-12.32-1.445-.496.15-1.023-.135-1.173-.63-.15-.497.136-1.024.632-1.173 4.48-1.358 10.067-.704 13.85 1.64.444.272.586.853.313 1.298zm.125-3.38C15.1 8.378 8.5 8.156 4.93 9.24c-.584.176-1.196-.153-1.374-.736-.176-.584.153-1.196.736-1.374 4.15-1.26 11.465-1.012 15.91 1.625.526.312.7 1.003.388 1.53-.313.525-1.003.7-1.53.387z"/></svg>
        Spotify
      </div>
      <div class="label">Top Artist</div>
      <div class="img-wrap">
        ${a.name ? `<img src="${lib.art[a.name] || ''}" alt="${esc(a.name)}" onerror="this.style.display='none'"/>` : ''}
      </div>
      <div class="name" data-text="${esc(a.name)}">${esc(a.name)}</div>
      <div class="desc">You spent ${Math.round(a.ms / 36e5)} hours with your favorite artist ${esc(a.name)}, and the pleasure is all theirs.</div>
    </div>
  `).join('');

  $("#view").innerHTML = `
    <div class="wrapped-grid">${cardsHtml}</div>
    
    <div class="g4" style="margin-top: 2rem;">
      <div class="big glass"><b data-n="${Math.round(mins)}">0</b><span>Minutes listened</span></div>
      <div class="big glass"><b data-n="${Math.round(s.ms / 36e5)}">0</b><span>Hours listened</span></div>
      <div class="big glass"><b data-n="${(s.ms / DAY).toFixed(1)}" data-d="1">0</b><span>Days of music</span></div>
      <div class="big glass"><b data-n="${(s.ms / (365 * DAY)).toFixed(2)}" data-d="2">0</b><span>Years listened</span></div>
    </div>
    <div class="g2" style="margin-top: 1rem;">
      ${feat("Top song of all time", coverHtml(t0.m.img, t0.m.n, false, `data-u="${esc(t0.uri)}"`), t0.m.n, t0.m.a, `${fmtNum(t0.c)} plays · ${fmtDur(t0.ms)}`)}
      ${feat("Top album of all time", coverHtml(lib.meta[l0.uri]?.img, l0.name, false, `data-u="${esc(l0.uri)}"`), l0.name, l0.artist, `${fmtNum(l0.c)} plays · ${fmtDur(l0.ms)}`)}
      ${feat("Biggest listening day", `<div class="cover glass" style="font-size:2rem">📅</div>`, dlabel(s.peak.k), peakT ? `Most played: ${lib.meta[peakT[0]]?.n} (${peakT[1]}×)` : "", `${fmtDur(s.peak.ms)} · ${fmtNum(s.peak.c)} plays`)}
      ${feat("Longest streak", `<div class="cover glass" style="font-size:2rem">🔥</div>`, `${s.best} days in a row`, `Current streak: ${s.cur} days`, `Listening since ${new Date(s.first).toLocaleDateString(undefined, { month: "long", year: "numeric" })}`)}
    </div>
    <div class="g2" style="margin-top: 1rem;">
      <div class="card pad rings glass"><svg viewBox="0 0 120 120">${ring(52, todayMin / cfg.goal, "#ff375f")}${ring(38, s.cur / 30, "#30d158")}${ring(24, (s.xp - s.lo) / (s.hi - s.lo), "#64d2ff")}</svg>
        <div class="rl"><div><i style="background:#ff375f"></i>Today <b>${Math.round(todayMin)}</b> / ${cfg.goal} min</div><div><i style="background:#30d158"></i>Streak <b>${s.cur}</b> / 30 days</div><div><i style="background:#64d2ff"></i>Level <b>${Math.round(((s.xp - s.lo) / (s.hi - s.lo)) * 100)}%</b> to ${s.level + 1}</div></div></div>
      <div class="card pad lvl glass"><div class="muted small">Level</div><div class="n">${s.level}</div><div><b>${["Newcomer", "Listener", "Regular", "Enthusiast", "Audiophile", "Superfan", "Legend", "Icon"][Math.min(7, Math.floor((s.level - 1) / 3))]}</b></div><div class="xp"><i data-w="${((s.xp - s.lo) / (s.hi - s.lo)) * 100}"></i></div><div class="muted small">${fmtNum(s.xp)} XP · ${fmtNum(s.hi - s.xp)} to level ${s.level + 1}</div></div>
    </div>
    <h3 style="margin-bottom:-.5rem; margin-top: 2rem;">Top 10 artists</h3>
    <div class="card glass">${s.artists.slice(0, 10).map((a, i) => artistRow(a, i, a0.c)).join("")}</div>
    <div class="g2" style="margin-top: 1rem;">
      <div><h3>Top 10 tracks</h3><div class="card glass">${s.tracks.slice(0, 10).map((t, i) => rowHtml(i, { t: t.m.n, s: t.m.a, img: t.m.img, v: `${fmtNum(t.c)} plays`, attr: `data-u="${esc(t.uri)}"` })).join("")}</div></div>
      <div><h3>Top 10 albums</h3><div class="card glass">${s.albums.slice(0, 10).map((l, i) => rowHtml(i, { t: l.name, s: l.artist, img: lib.meta[l.uri]?.img, v: `${fmtNum(l.c)} plays`, attr: `data-u="${esc(l.uri)}"` })).join("")}</div></div>
    </div>
    <div class="card pad glass" style="margin-top: 1rem;"><h3>Past year</h3><div class="heat">${heat}</div></div>
    <div class="card pad glass" style="margin-top: 1rem;"><h3>Hours listened per month</h3><div class="chart">${months.map(([k, v]) => `<div data-h="${(v / mmax) * 100}" title="${k}: ${Math.round(v / 36e5)} hrs"></div>`).join("")}</div><div class="axis"><span>${months[0]?.[0] || ""}</span><span>${months[months.length - 1]?.[0] || ""}</span></div></div>
    <div class="card pad glass" style="margin-top: 1rem;"><h3>When you listen</h3><div class="chart">${s.H.map((v, h) => `<div data-h="${(v / hmax) * 100}" title="${h}:00 · ${fmtNum(v)} plays"></div>`).join("")}</div><div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>`;

  fillImages([{ uri: t0.uri, img: t0.m.img }, { uri: l0.uri, img: lib.meta[l0.uri]?.img }, ...s.tracks.slice(0, 10).map((t) => ({ uri: t.uri, img: t.m.img })), ...s.albums.slice(0, 10).map((l) => ({ uri: l.uri, img: lib.meta[l.uri]?.img }))], "track");
  fillImages(s.artists.slice(0, 10).map((a) => ({ t: a.name, img: lib.art[a.name] })), "artist");
  
  // Execute the anime.js timeline
  initAnime();
}

function initAnime() {
  if (typeof anime === 'undefined') {
    reveal(); // Fallback
    return;
  }

  // Split the artist names into individual letters for animation
  document.querySelectorAll('.wrapped-card .name').forEach(el => {
    const text = el.dataset.text || el.textContent;
    el.innerHTML = text.split('').map(char => `<span style="display:inline-block">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
  });

  const tl = anime.timeline({
    easing: 'easeOutExpo',
    duration: 1200
  });

  // 1. Animate Cards flying in
  tl.add({
    targets: '.wrapped-card',
    translateY: [150, 0],
    opacity: [0, 1],
    scale: [0.8, 1],
    rotateZ: [10, 0],
    delay: anime.stagger(150),
    easing: 'easeOutElastic(1, .6)'
  })
  // 2. Fade in Logos and Labels
  .add({
    targets: '.wrapped-card .logo, .wrapped-card .label',
    opacity: [0, 1],
    translateY: [-20, 0],
    delay: anime.stagger(50)
  }, '-=1000')
  // 3. Expand Images
  .add({
    targets: '.wrapped-card .img-wrap',
    scale: [0.5, 1],
    rotate: [15, 0],
    opacity: [0, 1],
    delay: anime.stagger(100)
  }, '-=1000')
  // 4. Animate Artist Name Letters (Massive stagger)
  .add({
    targets: '.wrapped-card .name span',
    translateY: [40, 0],
    rotateX: [-90, 0],
    opacity: [0, 1],
    delay: anime.stagger(30)
  }, '-=1000')
  // 5. Fade in descriptions
  .add({
    targets: '.wrapped-card .desc',
    opacity: [0, 1],
    translateY: [20, 0],
    delay: anime.stagger(100)
  }, '-=800')
  // 6. Slide up all other glass sections
  .add({
    targets: '.g4, .g2, h3, .card',
    translateY: [50, 0],
    opacity: [0, 1],
    duration: 1000,
    delay: anime.stagger(100),
    easing: 'easeOutQuad'
  }, '-=800')
  // 7. Grow the progress bars
  .add({
    targets: '.bar i',
    width: (el) => `${el.dataset.w}%`,
    duration: 1500,
    delay: anime.stagger(50),
    easing: 'easeInOutQuart'
  }, '-=1000')
  // 8. Draw the rings
  .add({
    targets: '.rings circle.fg',
    strokeDashoffset: (el) => el.dataset.off,
    duration: 2000,
    delay: anime.stagger(150),
    easing: 'easeOutElastic(1, .8)'
  }, '-=1500')
  // 9. Populate the heatmap
  .add({
    targets: '.heat i',
    scale: [0, 1],
    opacity: [0, 1],
    delay: anime.stagger(5),
    duration: 500,
    easing: 'easeOutQuad'
  }, '-=2000')
  // 10. Raise the charts
  .add({
    targets: '.chart div',
    height: (el) => `${el.dataset.h}%`,
    duration: 1200,
    delay: anime.stagger(20),
    easing: 'easeOutBounce'
  }, '-=1800')
  // 11. Slide in the list rows
  .add({
    targets: '.row',
    opacity: [0, 1],
    translateX: [-20, 0],
    delay: anime.stagger(20)
  }, '-=1800');

  // Trigger the number count-up animation slightly after the sequence starts
  setTimeout(() => {
    document.querySelectorAll("[data-n]").forEach((el) => {
      const to = +el.dataset.n, d = +(el.dataset.d || 0);
      const fmt = (x) => x.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
      if (!cfg.anim) { el.textContent = fmt(to); return; }
      const t0 = performance.now();
      const f = (t) => { const q = Math.min(1, (t - t0) / 2000); el.textContent = fmt(to * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  }, 600);
}