const SCOPES2 = "user-read-currently-playing user-read-playback-state user-read-recently-played user-top-read user-modify-playback-state user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-private user-follow-read";

login = async function () {
  const verifier = rand(48);
  const challenge = b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  localStorage.setItem("verifier", verifier);
  localStorage.setItem("scopeV", "3");
  const p = new URLSearchParams({ client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT, scope: SCOPES2, code_challenge_method: "S256", code_challenge: challenge });
  location.href = `https://accounts.spotify.com/authorize?${p}`;
};
$("#loginBtn").onclick = login;

const css = document.createElement("style");
css.textContent = `
body.hasbar main{padding-bottom:8rem}
#pbar{position:fixed;left:0;right:0;bottom:0;z-index:20;background:var(--nav);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-top:1px solid var(--line);padding:.6rem 1rem;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,1.4fr) minmax(0,1fr);gap:1rem;align-items:center}
#pbar .l{display:flex;gap:.75rem;align-items:center;min-width:0}
#pbar .l .cover{width:48px;height:48px}
#pbar .c{display:grid;gap:.25rem;justify-items:center}
#pbar .k{display:flex;gap:.4rem;align-items:center}
#pbar .k button,#pbar .r button{width:34px;height:34px;border-radius:50%;font-size:1rem;color:var(--muted)}
#pbar .k button:hover,#pbar .r button:hover{background:var(--hover);color:var(--text)}
#pbar .k button.on,#pbar .r button.on{color:var(--accent)}
#pbar #pp{background:var(--text);color:var(--bg);width:40px;height:40px}
#pbar #pp:hover{background:var(--text);color:var(--bg);transform:scale(1.06)}
#pbar .sk{display:flex;gap:.5rem;align-items:center;width:100%;font-size:.72rem;color:var(--muted);font-variant-numeric:tabular-nums}
#pbar input[type=range]{flex:1;accent-color:var(--accent);min-width:0}
#pbar .r{display:flex;gap:.25rem;align-items:center;justify-content:flex-end}
#pbar .r input{max-width:90px}
.inp{width:100%;padding:.8rem 1rem;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--text);font:inherit;font-size:1.05rem}
.cover[data-u],.cover[data-p]{cursor:pointer}
.cover[data-u]:hover,.cover[data-p]:hover{filter:brightness(.7)}
.toast{position:fixed;left:50%;bottom:6.5rem;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:.6rem 1.1rem;border-radius:980px;font-size:.88rem;z-index:60}
.banner{background:var(--accent);color:#fff;padding:.6rem 1rem;display:flex;gap:1rem;align-items:center;justify-content:center;font-size:.9rem}
.banner button{background:rgba(255,255,255,.25);padding:.3rem .9rem;border-radius:980px;font-weight:600}
.dl{font-size:.75rem;font-weight:600;margin-left:.4rem}
.dl.up{color:#30d158}.dl.dn{color:#ff453a}
.seg button:disabled{opacity:.3;cursor:default}
.devrow{display:flex;justify-content:space-between;align-items:center;padding:.8rem 1rem;border-radius:12px;width:100%;text-align:left}
.devrow:hover{background:var(--hover)}
.devrow.on{color:var(--accent);font-weight:600}
@media(max-width:760px){#pbar{grid-template-columns:1fr auto;gap:.4rem}#pbar .c{grid-column:1/-1;grid-row:2}#pbar .r{grid-column:2;grid-row:1}#pbar .r input{display:none}}
`;
document.head.appendChild(css);

document.body.insertAdjacentHTML("beforeend", `<div id="pbar" hidden>
<div class="l"><img class="cover" id="pc" alt=""><div class="meta"><div class="t" id="pt"></div><div class="s" id="pa"></div></div><button id="plk" data-a="like" aria-label="Like">♡</button></div>
<div class="c"><div class="k"><button id="psh" data-a="shuffle" aria-label="Shuffle">⇄</button><button data-a="prev" aria-label="Previous">⏮</button><button id="pp" data-a="toggle" aria-label="Play or pause">▶</button><button data-a="next" aria-label="Next">⏭</button><button id="prp" data-a="repeat" aria-label="Repeat">↻</button></div>
<div class="sk"><span id="pel">0:00</span><input type="range" id="psk" min="0" max="1" step="1000" value="0"><span id="pdu">0:00</span></div></div>
<div class="r"><button data-a="queue" aria-label="Queue">☰</button><button data-a="devices" aria-label="Devices">🔊</button><input type="range" id="pvo" min="0" max="100" value="50" aria-label="Volume"></div></div>`);

if (localStorage.getItem("refresh") && localStorage.getItem("scopeV") !== "3") {
  $("#app").insertAdjacentHTML("afterbegin", `<div class="banner" id="reauth">Reconnect Spotify to unlock playback, search and playlists <button id="reauthBtn">Reconnect</button></div>`);
  $("#reauthBtn").onclick = login;
}

let ps = null, at = 0, likeId = null, isLiked = false, seeking = false, volDrag = false;

async function call(method, path, body) {
  const r = await fetch(`https://api.spotify.com/v1${path}`, { method, headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 429) { await new Promise((s) => setTimeout(s, (+r.headers.get("Retry-After") || 2) * 1000)); return call(method, path, body); }
  return r;
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function modal(html) {
  const el = document.createElement("div");
  el.className = "modal";
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
  const img = (t.album && ((t.album.images[1] && t.album.images[1].url) || (t.album.images[0] && t.album.images[0].url))) || "";
  if (img && $("#pc").getAttribute("src") !== img) $("#pc").src = img;
  $("#pt").textContent = t.name;
  $("#pa").textContent = t.artists ? t.artists.map((a) => a.name).join(", ") : (t.show && t.show.name) || "";
  $("#pp").textContent = ps.is_playing ? "⏸" : "▶";
  $("#psh").classList.toggle("on", !!ps.shuffle_state);
  $("#prp").classList.toggle("on", ps.repeat_state !== "off");
  $("#prp").textContent = ps.repeat_state === "track" ? "↻¹" : "↻";
  $("#psk").max = t.duration_ms;
  $("#pdu").textContent = fmtClock(t.duration_ms);
  if (ps.device && ps.device.volume_percent != null && !volDrag) $("#pvo").value = ps.device.volume_percent;
  document.title = `${ps.is_playing ? "▶ " : ""}${t.name} · ${$("#pa").textContent}`;
  if (t.id !== likeId) { likeId = t.id; checkLike(t.id); }
  tickBar();
}

function tickBar() {
  if (!ps || !ps.item || seeking) return;
  const p = Math.min(ps.item.duration_ms, ps.progress_ms + (ps.is_playing ? Date.now() - at : 0));
  $("#psk").value = p;
  $("#pel").textContent = fmtClock(p);
}

async function checkLike(id) {
  try { const r = await api(`/me/tracks/contains?ids=${id}`); isLiked = !!r[0]; } catch (e) { isLiked = false; }
  $("#plk").textContent = isLiked ? "♥" : "♡";
  $("#plk").classList.toggle("on", isLiked);
}

async function act(method, path) {
  const r = await call(method, `/me/player/${path}`);
  if (r.status === 403) toast("Playback control needs Spotify Premium");
  if (r.status === 404) toast("No active device. Open Spotify somewhere first");
  setTimeout(poll, 350);
}

async function playBody(body) {
  let r = await call("PUT", "/me/player/play", body);
  if (r.status === 404) {
    let d = null;
    try { d = await api("/me/player/devices"); } catch (e) {}
    const dev = d && d.devices && d.devices[0];
    if (!dev) { toast("Open Spotify on a device first"); return; }
    r = await call("PUT", `/me/player/play?device_id=${dev.id}`, body);
  }
  if (r.status === 403) toast("Playback needs Spotify Premium and a reconnect");
  setTimeout(poll, 450);
}

const play = (uri) => playBody(uri.startsWith("spotify:track:") ? { uris: [uri] } : { context_uri: uri });
const playMany = (uris) => playBody({ uris: uris.slice(0, 100) });
const enqueue = async (uri) => { const r = await call("POST", `/me/player/queue?uri=${encodeURIComponent(uri)}`); toast(r.ok ? "Added to queue" : "Could not queue that"); };

async function showDevices() {
  let d = { devices: [] };
  try { d = await api("/me/player/devices"); } catch (e) {}
  const el = modal(`<h2>Devices</h2>${d.devices.length ? d.devices.map((x) => `<button class="devrow${x.is_active ? " on" : ""}" data-id="${esc(x.id)}"><span>${esc(x.name)}</span><span class="muted small">${esc(x.type)}${x.is_active ? " · active" : ""}</span></button>`).join("") : `<div class="empty">No devices found. Open Spotify on a phone or computer.</div>`}`);
  el.querySelectorAll(".devrow").forEach((b) => b.onclick = async () => { await call("PUT", "/me/player", { device_ids: [b.dataset.id], play: true }); el.remove(); setTimeout(poll, 500); });
}

async function showQueue() {
  let q = null;
  try { q = await api("/me/player/queue"); } catch (e) {}
  const list = q ? [q.currently_playing, ...q.queue].filter(Boolean).slice(0, 30) : [];
  modal(`<h2>Queue</h2><div>${list.length ? list.map((x, i) => rowHtml(i, { t: x.name, s: (x.artists && x.artists[0] && x.artists[0].name) || "", img: x.album && x.album.images[1] && x.album.images[1].url, v: i ? "" : "Now", attr: `data-u="${esc(x.uri)}"` })).join("") : `<div class="empty">Queue is empty.</div>`}</div>`);
}

$("#pbar").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a;
  if (a === "toggle") act("PUT", ps && ps.is_playing ? "pause" : "play");
  else if (a === "next") act("POST", "next");
  else if (a === "prev") act("POST", "previous");
  else if (a === "shuffle") act("PUT", `shuffle?state=${!(ps && ps.shuffle_state)}`);
  else if (a === "repeat") act("PUT", `repeat?state=${{ off: "context", context: "track", track: "off" }[(ps && ps.repeat_state) || "off"]}`);
  else if (a === "devices") showDevices();
  else if (a === "queue") showQueue();
  else if (a === "like" && likeId) { await call(isLiked ? "DELETE" : "PUT", `/me/tracks?ids=${likeId}`); checkLike(likeId); }
});

$("#psk").oninput = (e) => { seeking = true; $("#pel").textContent = fmtClock(+e.target.value); };
$("#psk").onchange = async (e) => { await call("PUT", `/me/player/seek?position_ms=${Math.round(e.target.value)}`); seeking = false; setTimeout(poll, 300); };
$("#pvo").oninput = () => { volDrag = true; };
$("#pvo").onchange = async (e) => { await call("PUT", `/me/player/volume?volume_percent=${e.target.value}`); volDrag = false; };

document.addEventListener("click", (e) => {
  const el = e.target.closest(".cover[data-u], .cover[data-p]");
  if (!el || e.target.closest("#pbar")) return;
  e.stopPropagation();
  const uri = el.dataset.p || el.dataset.u;
  if (e.shiftKey && uri.startsWith("spotify:track:")) enqueue(uri); else play(uri);
}, true);

document.addEventListener("keydown", (e) => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey) return;
  if (e.code === "Space") { e.preventDefault(); act("PUT", ps && ps.is_playing ? "pause" : "play"); }
  else if (e.key === "ArrowRight") act("POST", "next");
  else if (e.key === "ArrowLeft") act("POST", "previous");
});

setInterval(tickBar, 500);
setInterval(() => { if (localStorage.getItem("refresh") && !document.hidden) poll(); }, 4000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && localStorage.getItem("refresh")) poll(); });
if (localStorage.getItem("refresh")) poll();

$("#tabs").insertAdjacentHTML("beforeend", [["wrap", "Wrapped"], ["search", "Search"], ["library", "Library"]].map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join(""));

let wp = { p: "month", off: 0 };
let libTab = "playlists";

function span(p, off) {
  const now = new Date();
  let a, b;
  if (p === "week") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) - off * 7);
    a = d;
    b = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
  } else if (p === "month") {
    a = new Date(now.getFullYear(), now.getMonth() - off, 1);
    b = new Date(now.getFullYear(), now.getMonth() - off + 1, 1);
  } else {
    a = new Date(now.getFullYear() - off, 0, 1);
    b = new Date(now.getFullYear() - off + 1, 0, 1);
  }
  const f = (d, o) => d.toLocaleDateString(undefined, o);
  const label = p === "week" ? `${f(a, { month: "short", day: "numeric" })} to ${f(new Date(b - 1), { month: "short", day: "numeric", year: "numeric" })}` : p === "month" ? f(a, { month: "long", year: "numeric" }) : String(a.getFullYear());
  return [+a, +b, label];
}

function periodStats(a, b) {
  const A = new Map(), T = new Map(), L = new Map(), dm = new Map(), H = Array(24).fill(0);
  let ms = 0, n = 0;
  for (const [ts, uri, d] of lib.plays) {
    if (ts < a || ts >= b) continue;
    const m = lib.meta[uri];
    if (!m) continue;
    n++; ms += d;
    const ar = A.get(m.a) || { name: m.a, c: 0, ms: 0 };
    ar.c++; ar.ms += d; A.set(m.a, ar);
    const t = T.get(uri) || { uri, m, c: 0, ms: 0 };
    t.c++; t.ms += d; T.set(uri, t);
    const lk = `${m.al}|${m.a}`;
    const l = L.get(lk) || { name: m.al || "Unknown album", artist: m.a, uri, c: 0, ms: 0 };
    l.c++; l.ms += d; L.set(lk, l);
    H[new Date(ts).getHours()]++;
    const k = dkey(ts);
    dm.set(k, (dm.get(k) || 0) + d);
  }
  const by = (x) => [...x.values()].sort((p, q) => q.c - p.c || q.ms - p.ms);
  return { n, ms, H, days: dm.size, A, artists: by(A), tracks: by(T), albums: by(L), peak: [...dm.entries()].sort((p, q) => q[1] - p[1])[0] };
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
  const c = document.createElement("canvas");
  c.width = 1080; c.height = 1350;
  const g = c.getContext("2d");
  const ac = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff8800";
  const gr = g.createLinearGradient(0, 0, 1080, 1350);
  gr.addColorStop(0, ac); gr.addColorStop(1, "#5e5ce6");
  g.fillStyle = gr; g.fillRect(0, 0, 1080, 1350);
  g.fillStyle = "#fff";
  g.font = "600 44px system-ui"; g.fillText(`${label} Wrapped`, 80, 130);
  g.font = "800 92px system-ui"; g.fillText(s.artists[0].name.slice(0, 16), 80, 270);
  g.font = "500 40px system-ui"; g.fillText(`${Math.round(s.ms / 6e4).toLocaleString()} minutes · ${s.n.toLocaleString()} plays`, 80, 345);
  g.font = "700 44px system-ui"; g.fillText("Top artists", 80, 470); g.fillText("Top tracks", 570, 470);
  g.font = "500 34px system-ui";
  s.artists.slice(0, 5).forEach((x, i) => g.fillText(`${i + 1}. ${x.name.slice(0, 17)}`, 80, 545 + i * 85));
  s.tracks.slice(0, 5).forEach((x, i) => g.fillText(`${i + 1}. ${x.m.n.slice(0, 19)}`, 570, 545 + i * 85));
  c.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `wrapped-${label.replace(/\W+/g, "-")}.png`; a.click(); });
}

function renderWrap() {
  const [a, b, label] = span(wp.p, wp.off);
  const [pa, pb] = span(wp.p, wp.off + 1);
  const s = periodStats(a, b), q = periodStats(pa, pb);
  const all = compute();
  const dl = (x, y) => (y ? `<span class="dl ${x >= y ? "up" : "dn"}">${x >= y ? "▲" : "▼"} ${Math.abs(Math.round(((x - y) / y) * 100))}%</span>` : "");
  const head = `<div class="head"><h2>Wrapped</h2><div class="ctrls"><div class="seg sm" id="wseg">${["week", "month", "year"].map((k) => `<button data-w="${k}" class="${k === wp.p ? "on" : ""}">${k[0].toUpperCase() + k.slice(1)}</button>`).join("")}</div><div class="seg sm" id="wnav"><button data-d="1">‹</button><button data-d="-1" ${wp.off === 0 ? "disabled" : ""}>›</button></div></div></div><p class="sub">${label}</p>`;
  const bind = () => {
    $("#wseg").onclick = (e) => { if (e.target.dataset.w) { wp = { p: e.target.dataset.w, off: 0 }; renderWrap(); } };
    $("#wnav").onclick = (e) => { const d = e.target.dataset.d; if (d) { wp.off = Math.max(0, wp.off + +d); renderWrap(); } };
  };
  if (!s.n) {
    $("#view").innerHTML = `${head}<div class="card pad"><p class="muted">No plays recorded for this period.</p></div>`;
    return bind();
  }
  const a0 = s.artists[0];
  const ph = s.H.indexOf(Math.max(...s.H));
  const persona = ph >= 22 || ph < 4 ? "Night Owl" : ph < 9 ? "Early Bird" : ph < 17 ? "Daytime Listener" : "Evening Regular";
  const hl = (h) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
  const fresh = s.artists.filter((x) => all.A.get(x.name) && all.A.get(x.name).first >= a).length;
  const hmax = Math.max(1, ...s.H);
  const amax = a0.c;
  const tiles = [[Math.round(s.ms / 6e4), "Minutes", dl(s.ms, q.ms)], [s.n, "Plays", dl(s.n, q.n)], [s.A.size, "Artists", dl(s.A.size, q.A.size)], [s.days, "Active days", ""], [fresh, "New artists", ""], [(s.n / s.tracks.length).toFixed(1), "Plays per track", ""]];
  $("#view").innerHTML = `${head}
    <section class="hero"><div><div class="hl">Your top artist · ${label}</div><h1>${esc(a0.name)}</h1>
      <div class="hs"><b data-n="${a0.c}">0</b> plays · <b data-n="${Math.round(a0.ms / 6e4)}">0</b> minutes</div>
      <div class="hr">${persona} · peak listening around ${hl(ph)}${s.peak ? ` · biggest day ${dlabel(s.peak[0])}` : ""}</div></div>
      ${coverHtml(lib.art[a0.name] || "", a0.name, true, `data-k="${esc(a0.name)}"`)}</section>
    <div class="g4">${tiles.map(([v, l, d]) => `<div class="big"><b>${typeof v === "number" ? fmtNum(v) : v}</b><span>${l}${d}</span></div>`).join("")}</div>
    <div class="actions" style="margin-top:0"><button class="btn primary" id="wPlay">▶ Play top tracks</button><button class="btn" id="wSave">Save as playlist</button><button class="btn" id="wCard">Download card</button></div>
    <h3 style="margin-bottom:-.5rem">Top artists</h3>
    <div class="card">${s.artists.slice(0, 5).map((x, i) => artistRow(x, i, amax)).join("")}</div>
    <div class="g2">
      <div><h3>Top tracks</h3><div class="card">${s.tracks.slice(0, 8).map((t, i) => rowHtml(i, { t: t.m.n, s: t.m.a, img: t.m.img, v: `${fmtNum(t.c)} plays`, attr: `data-u="${esc(t.uri)}"` })).join("")}</div></div>
      <div><h3>Top albums</h3><div class="card">${s.albums.slice(0, 8).map((l, i) => rowHtml(i, { t: l.name, s: l.artist, img: lib.meta[l.uri] && lib.meta[l.uri].img, v: `${fmtNum(l.c)} plays`, attr: `data-u="${esc(l.uri)}"` })).join("")}</div></div>
    </div>
    <div class="card pad"><h3>When you listened</h3><div class="chart">${s.H.map((v, h) => `<div data-h="${(v / hmax) * 100}" title="${hl(h)} · ${fmtNum(v)} plays"></div>`).join("")}</div><div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div></div>`;
  bind();
  $("#wPlay").onclick = () => playMany(s.tracks.slice(0, 30).map((t) => t.uri));
  $("#wSave").onclick = () => savePlaylist(`Top tracks · ${label}`, s.tracks.slice(0, 30).map((t) => t.uri));
  $("#wCard").onclick = () => shareCard(label, s);
  fillImages([...s.tracks.slice(0, 8).map((t) => ({ uri: t.uri, img: t.m.img })), ...s.albums.slice(0, 8).map((l) => ({ uri: l.uri, img: lib.meta[l.uri] && lib.meta[l.uri].img }))], "track");
  fillImages(s.artists.slice(0, 5).map((x) => ({ t: x.name, img: lib.art[x.name] })), "artist");
  reveal();
}

function renderSearch() {
  $("#view").innerHTML = `<h2>Search</h2><input id="q" class="inp" placeholder="Songs, albums, artists, playlists" autocomplete="off"><div id="res"></div><p class="muted small">Click a cover to play. Shift-click a track cover to queue it.</p>`;
  let tm;
  $("#q").oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => doSearch(e.target.value.trim()), 350); };
  $("#q").focus();
}

async function doSearch(q) {
  const box = $("#res");
  if (!box) return;
  if (!q) { box.innerHTML = ""; return; }
  try {
    const d = await api(`/search?q=${encodeURIComponent(q)}&type=track,album,artist,playlist&limit=8`);
    const sec = (title, items, fn) => { const l = (items || []).filter(Boolean); return l.length ? `<h3 style="margin-top:1rem">${title}</h3><div class="card">${l.map(fn).join("")}</div>` : ""; };
    const im = (x) => (x.images && ((x.images[1] && x.images[1].url) || (x.images[0] && x.images[0].url))) || "";
    if (!$("#res")) return;
    box.innerHTML =
      sec("Tracks", d.tracks && d.tracks.items, (x, i) => rowHtml(i, { t: x.name, s: `${x.artists[0] ? x.artists[0].name : ""} · ${x.album.name}`, img: x.album.images[1] && x.album.images[1].url, v: fmtClock(x.duration_ms), attr: `data-u="${esc(x.uri)}"` })) +
      sec("Artists", d.artists && d.artists.items, (x, i) => rowHtml(i, { t: x.name, s: (x.genres || []).slice(0, 2).join(", "), img: im(x), v: "Artist", attr: `data-p="${esc(x.uri)}"` }, true)) +
      sec("Albums", d.albums && d.albums.items, (x, i) => rowHtml(i, { t: x.name, s: x.artists[0] ? x.artists[0].name : "", img: im(x), v: x.release_date ? x.release_date.slice(0, 4) : "", attr: `data-p="${esc(x.uri)}"` })) +
      sec("Playlists", d.playlists && d.playlists.items, (x, i) => rowHtml(i, { t: x.name, s: x.owner ? x.owner.display_name : "", img: im(x), v: "Playlist", attr: `data-p="${esc(x.uri)}"` }));
  } catch (e) {
    box.innerHTML = `<div class="card"><div class="empty">Search failed. Try reconnecting Spotify.</div></div>`;
  }
}

async function renderLibrary() {
  $("#view").innerHTML = `<div class="head"><h2>Library</h2><div class="seg sm" id="lseg">${[["playlists", "Playlists"], ["liked", "Liked"], ["albums", "Albums"], ["artists", "Following"]].map(([k, l]) => `<button data-l="${k}" class="${k === libTab ? "on" : ""}">${l}</button>`).join("")}</div></div><div class="card" id="lbox"><div class="empty">Loading…</div></div>`;
  $("#lseg").onclick = (e) => { if (e.target.dataset.l) { libTab = e.target.dataset.l; renderLibrary(); } };
  const im = (x) => (x && x.images && ((x.images[1] && x.images[1].url) || (x.images[0] && x.images[0].url))) || "";
  let rows = [];
  try {
    if (libTab === "playlists") {
      const d = await api("/me/playlists?limit=50");
      rows = d.items.filter(Boolean).map((x) => ({ t: x.name, s: `${((x.items || x.tracks || {}).total ?? "")} tracks`, img: im(x), v: "Playlist", attr: `data-p="${esc(x.uri)}"` }));
    } else if (libTab === "liked") {
      const d = await api("/me/tracks?limit=50");
      rows = d.items.map((i) => i.track).filter(Boolean).map((x) => ({ t: x.name, s: `${x.artists[0] ? x.artists[0].name : ""} · ${x.album.name}`, img: im(x.album), v: fmtClock(x.duration_ms), attr: `data-u="${esc(x.uri)}"` }));
    } else if (libTab === "albums") {
      const d = await api("/me/albums?limit=50");
      rows = d.items.map((i) => i.album).filter(Boolean).map((x) => ({ t: x.name, s: x.artists[0] ? x.artists[0].name : "", img: im(x), v: x.release_date ? x.release_date.slice(0, 4) : "", attr: `data-p="${esc(x.uri)}"` }));
    } else {
      const d = await api("/me/following?type=artist&limit=50");
      rows = d.artists.items.map((x) => ({ t: x.name, s: (x.genres || []).slice(0, 2).join(", "), img: im(x), v: "Artist", attr: `data-p="${esc(x.uri)}"` }));
    }
  } catch (e) {}
  const box = $("#lbox");
  if (tab !== "library" || !box) return;
  box.innerHTML = rows.length ? rows.map((r, i) => rowHtml(i, r, libTab === "artists")).join("") : `<div class="empty">Nothing here, or Spotify needs you to reconnect.</div>`;
}

const baseRender = render;
render = function () {
  if (["wrap", "search", "library"].includes(tab)) {
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    clearInterval(nowTimer);
    ({ wrap: renderWrap, search: renderSearch, library: renderLibrary })[tab]();
  } else baseRender();
};
