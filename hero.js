const hcss = document.createElement("style");
hcss.textContent = `
.hx{position:fixed;inset:0;z-index:90;color:#fff}
.hbg{position:absolute;inset:0}
.hbg::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.32);backdrop-filter:blur(40px) saturate(150%);-webkit-backdrop-filter:blur(40px) saturate(150%)}
.hd{position:absolute;inset:0;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none}
.hd::-webkit-scrollbar{display:none}
.hs{height:100vh;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;gap:3vw;padding:3vh 4vw;position:relative}
.hc{height:min(86vh,calc(44vw*16/9));aspect-ratio:9/16;flex:none;will-change:transform}
.hc .sc{width:100%;height:100%;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.hp{width:min(560px,46vw);max-height:86vh;overflow:auto;padding:1.6rem;border-radius:28px;background:rgba(255,255,255,.14);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 20px 60px rgba(0,0,0,.25);scrollbar-width:none}
.hpt{font-size:2.2rem;font-weight:800;letter-spacing:-.03em;line-height:1.05;margin-bottom:1rem;word-break:break-word}
.hp h5{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;opacity:.7;margin:1.2rem 0 .5rem}
.hcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.6rem}
.hc2{background:rgba(255,255,255,.14);border-radius:16px;padding:.8rem .9rem;display:grid;gap:.15rem}
.hc2 b{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.hc2 span{font-size:.78rem;opacity:.75}
.hart{width:84px;height:84px;border-radius:50%;object-fit:cover;margin-bottom:1rem;display:block}
.mb{display:flex;align-items:flex-end;gap:3px;height:90px}
.mbi{flex:1;height:0%;min-height:2px;background:rgba(255,255,255,.45);border-radius:4px 4px 0 0}
.mbi.hi{background:#fff}
.mbl{display:flex;justify-content:space-between;font-size:.7rem;opacity:.7;margin-top:.3rem}
.hr2{display:flex;gap:.8rem;align-items:center;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.15)}
.hr2>b{width:1.4rem;opacity:.6;text-align:right}
.hr2>div{flex:1;min-width:0;display:grid}
.hr2 em{font-style:normal;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hr2 small{opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hr2>span{font-size:.85rem;opacity:.85;white-space:nowrap}
.hbar{height:5px;border-radius:5px;background:rgba(255,255,255,.18);margin-top:.35rem;overflow:hidden}
.hbar i{display:block;height:100%;width:0%;background:#fff;border-radius:5px}
.hdots{position:fixed;right:1.1rem;top:50%;transform:translateY(-50%);display:grid;gap:.6rem;z-index:5}
.hdots button{width:10px;height:10px;border-radius:50%;background:#fff;opacity:.4}
.hx-x{position:fixed;top:1rem;right:1rem;z-index:6;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.3);backdrop-filter:blur(10px);color:#fff;font-size:1.1rem}
.hhint{position:fixed;bottom:1.2rem;left:50%;margin-left:-3rem;z-index:5;font-weight:600;opacity:.8}
.fl{position:fixed;z-index:95;margin:0;overflow:hidden;border-radius:26px;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.fl .sc{width:100%;height:100%;border-radius:inherit}
@media(max-width:900px){.hd{scroll-snap-type:y proximity}.hs{height:auto;min-height:100vh;flex-direction:column;padding:6vh 4vw}.hc{height:72vh}.hp{width:100%;max-height:none}}
`;
document.head.appendChild(hcss);

const HL = (k) => ([0, 6, 12, 18, 23].includes(k) ? `${k % 12 || 12}${k < 12 ? "a" : "p"}` : "");
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fd = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const chips = (a) => `<div class="hcs">${a.map(([v, l]) => `<div class="hc2"><b${typeof v === "number" ? ` data-n="${v}"` : ""}>${typeof v === "number" ? fmtNum(v) : esc(v)}</b><span>${l}</span></div>`).join("")}</div>`;
const bars = (arr, lb, hi, t) => { const m = Math.max(1, ...arr); return `<h5>${t}</h5><div class="mb">${arr.map((v, k) => `<div class="mbi${k === hi ? " hi" : ""}" data-h="${Math.round((v / m) * 100)}" title="${esc(lb[k] || k)}: ${fmtNum(Math.round(v))}"></div>`).join("")}</div><div class="mbl">${lb.filter((x) => x).map((x) => `<span>${x}</span>`).join("")}</div>`; };
const rws = (t, list) => { const m = Math.max(1, ...list.map((r) => r[2])); return `<h5>${t}</h5>${list.map((r, k) => `<div class="hr2"><b>${k + 1}</b><div><em>${esc(r[0])}</em><small>${esc(r[1] || "")}</small><div class="hbar"><i data-w="${Math.round((r[2] / m) * 100)}"></i></div></div><span>${esc(r[3])}</span></div>`).join("")}`; };
const fresh = (X) => X.s.artists.filter((x) => X.all.A.get(x.name) && X.all.A.get(x.name).first >= X.a);

function ctx() {
  const [a, b, label] = span(wp.p, wp.off), [pa, pb] = span(wp.p, wp.off + 1);
  const pl = lib.plays.filter((p) => p[0] >= a && p[0] < b && lib.meta[p[1]]);
  const wk = Array(7).fill(0), dm = new Map();
  for (const [ts, u, d] of pl) {
    wk[(new Date(ts).getDay() + 6) % 7] += d / 6e4;
    const k = dkey(ts), o = dm.get(k) || { k, ms: 0, c: 0, t: new Map() };
    o.ms += d; o.c++; o.t.set(u, (o.t.get(u) || 0) + 1); dm.set(k, o);
  }
  return { a, b, label, s: W.s, q: periodStats(pa, pb), all: compute(), pl, wk, days: [...dm.values()].sort((x, y) => y.ms - x.ms) };
}

const DT = [
  (X) => ["The big picture", chips([[X.s.n, "plays"], [X.s.tracks.length, "different tracks"], [X.s.A.size, "artists"], [X.s.days, "active days"], [Math.round(X.s.n / Math.max(1, X.s.days)), "plays per active day"], [X.q.n ? `${X.s.n >= X.q.n ? "+" : "-"}${Math.abs(Math.round(((X.s.n - X.q.n) / X.q.n) * 100))}%` : "New", "vs last period"]])],
  (X) => ["Where the minutes went", chips([[Math.round(X.s.ms / 36e5), "hours"], [Math.round(X.s.ms / 6e4 / Math.max(1, X.s.days)), "min per active day"], [Math.round(X.s.ms / 27e5), "albums' worth"], [Math.round(X.s.ms / 66e5), "movies' worth"]]) + bars(X.wk, WD, X.wk.indexOf(Math.max(...X.wk)), "Minutes by weekday")],
  (X) => {
    const n = X.s.artists[0].name, ar = X.all.A.get(n), mine = X.pl.filter((p) => lib.meta[p[1]].a === n), h = Array(24).fill(0), tc = new Map();
    mine.forEach((p) => { h[new Date(p[0]).getHours()]++; tc.set(p[1], (tc.get(p[1]) || 0) + 1); });
    const top = [...tc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([u, c]) => [lib.meta[u].n, lib.meta[u].al, c, `${c} plays`]);
    return [n, (lib.art[n] ? `<img class="hart" src="${esc(lib.art[n])}" alt="">` : "") + chips([[X.all.artists.findIndex((x) => x.name === n) + 1, "all-time rank"], [ar ? ar.c : 0, "all-time plays"], [`${((X.s.artists[0].c / X.s.n) * 100).toFixed(1)}%`, "of this period"], [ar ? fd(ar.first) : "-", "first played"], [fd(Math.max(...mine.map((p) => p[0]))), "last played"], [tc.size, "songs played"]]) + rws("Their most played", top) + bars(h, h.map((_, k) => HL(k)), h.indexOf(Math.max(...h)), "When you play them")];
  },
  (X) => {
    const t = X.s.tracks[0], mine = X.pl.filter((p) => p[1] === t.uri), A = X.all.T.get(t.uri);
    const more = X.s.tracks.filter((x) => x.m.a === t.m.a && x.uri !== t.uri).slice(0, 4).map((x) => [x.m.n, x.m.al, x.c, `${x.c} plays`]);
    return [t.m.n, chips([[t.c, "plays"], [Math.round(t.ms / 6e4), "minutes"], [A ? A.c : t.c, "all-time plays"], [`${((t.c / X.s.n) * 100).toFixed(1)}%`, "of everything"], [fd(Math.min(...mine.map((p) => p[0]))), "first play"], [fd(Math.max(...mine.map((p) => p[0]))), "latest play"]]) + `<h5>${esc(t.m.a)} · ${esc(t.m.al)}</h5>` + (more.length ? rws("More from them", more) : "")];
  },
  (X) => ["Your top 10 artists", chips([[`${Math.round((X.s.artists.slice(0, 5).reduce((a, x) => a + x.c, 0) / X.s.n) * 100)}%`, "of plays from your top 5"]]) + rws("By plays", X.s.artists.slice(0, 10).map((x) => [x.name, fmtDur(x.ms), x.c, fmtNum(x.c)]))],
  (X) => ["Your top 10 tracks", rws("By plays", X.s.tracks.slice(0, 10).map((x) => [x.m.n, x.m.a, x.c, fmtNum(x.c)]))],
  (X) => ["Your top 10 albums", rws("By plays", X.s.albums.slice(0, 10).map((x) => [x.name, x.artist, x.c, fmtNum(x.c)]))],
  (X) => {
    const H = X.s.H, sum = (f, t) => H.slice(f, t).reduce((a, b) => a + b, 0), pc = (v) => `${Math.round((v / Math.max(1, X.s.n)) * 100)}%`;
    return ["Your listening clock", chips([[pc(sum(5, 12)), "morning"], [pc(sum(12, 17)), "afternoon"], [pc(sum(17, 22)), "evening"], [pc(sum(22, 24) + sum(0, 5)), "night"]]) + bars(H, H.map((_, k) => HL(k)), H.indexOf(Math.max(...H)), "Plays by hour") + bars(X.wk, WD, X.wk.indexOf(Math.max(...X.wk)), "Minutes by weekday")];
  },
  (X) => ["Your heaviest days", rws("Top 5 days", X.days.slice(0, 5).map((d) => { const u = [...d.t.entries()].sort((x, y) => y[1] - x[1])[0]; return [new Date(dn(d.k) * DAY).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }), `${lib.meta[u[0]].n} · ${u[1]}×`, d.ms, fmtDur(d.ms)]; }))],
  (X) => { const fr = fresh(X); return ["Fresh finds", chips([[fr.length, "new artists"], [(X.s.n / X.s.tracks.length).toFixed(1), "plays per track"], [`${Math.round((X.s.tracks.filter((t) => t.c > 1).length / X.s.tracks.length) * 100)}%`, "tracks replayed"]]) + (fr.length ? rws("Newly discovered", fr.slice(0, 8).map((x) => [x.name, `first played ${fd(X.all.A.get(x.name).first)}`, x.c, `${x.c} plays`])) : "")]; },
  (X) => ["The full picture", chips([[Math.round(X.s.ms / 6e4), "minutes"], [X.s.n, "plays"], [X.s.A.size, "artists"], [X.all.best, "best streak (days)"], [X.all.level, "your level"], [X.all.cur, "current streak"]]) + rws("Top tracks", X.s.tracks.slice(0, 5).map((x) => [x.m.n, x.m.a, x.c, fmtNum(x.c)]))]
];

function pEnter(sec, k) {
  const p = sec.querySelector(".hp"), c = sec.querySelector(".sc");
  anime.remove(sec.querySelectorAll("*"));
  c.querySelectorAll(".pt").forEach((x) => x.remove());
  p.querySelectorAll(".mbi").forEach((e) => { e.style.height = cfg.anim ? "0%" : `${e.dataset.h}%`; });
  p.querySelectorAll(".hbar i").forEach((e) => { e.style.width = cfg.anim ? "0%" : `${e.dataset.w}%`; });
  if (!cfg.anim) return;
  enter(c, k);
  const g = (n, s, o) => {
    const t = p.querySelectorAll(s);
    if (!t.length) return;
    FX.set.add(`hero${k}.${n}`);
    return anime({ targets: t, easing: "easeOutExpo", ...o });
  };
  g("title", ".hpt", { translateY: [30, 0], opacity: [0, 1], duration: 800 });
  g("chips", ".hc2", { scale: [0.6, 1], rotateX: [-70, 0], opacity: [0, 1], delay: anime.stagger(70, { start: 250 }), duration: 800, easing: "easeOutBack" });
  g("h5", "h5", { translateX: [-24, 0], opacity: [0, 1], delay: anime.stagger(120, { start: 400 }), duration: 700 });
  g("mb", ".mbi", { height: (e) => `${e.dataset.h}%`, delay: anime.stagger(22, { start: 500 }), duration: 900, easing: "easeOutElastic(1,.7)" });
  g("hbar", ".hbar i", { width: (e) => `${e.dataset.w}%`, delay: anime.stagger(60, { start: 600 }), duration: 1100 });
  g("rows", ".hr2", { translateX: [40, 0], opacity: [0, 1], delay: anime.stagger(60, { start: 500 }), duration: 700 });
  g("img", ".hart", { scale: [0, 1], rotate: [-30, 0], duration: 1000, easing: "easeOutElastic(1,.6)" });
  g("lbl", ".mbl span", { opacity: [0, 1], translateY: [8, 0], delay: anime.stagger(40, { start: 900 }), duration: 500 });
  p.querySelectorAll("[data-n]").forEach((n) => {
    const o = { v: 0 };
    FX.set.add(`hero${k}.cnt`);
    anime({ targets: o, v: +n.dataset.n, round: 1, duration: 1500, delay: 300, easing: "easeOutExpo", update: () => { n.textContent = o.v.toLocaleString(); } });
  });
}

function flip(html, from, to, done) {
  const el = document.createElement("div");
  el.className = "fl";
  el.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
  el.innerHTML = html;
  document.body.appendChild(el);
  FX.set.add("hero.flip");
  anime({ targets: el, left: to.left, top: to.top, width: to.width, height: to.height, duration: cfg.anim ? 950 : 1, easing: "easeInOutQuart", complete: () => { el.remove(); if (done) done(); } });
}

openStory = function (i0 = 0) {
  if (!W || document.querySelector(".hx")) return;
  const X = ctx();
  const bgOf = (h) => /--bg:([^;"]+)/.exec(h)[1].trim();
  const hx = document.createElement("div");
  hx.className = "hx";
  hx.innerHTML = `<div class="hbg"></div><div class="hd" style="visibility:hidden">${W.slides.map((h, k) => { const [t, d] = DT[k](X); return `<section class="hs"><div class="hc">${h}</div><div class="hp"><h3 class="hpt">${esc(t)}</h3>${d}</div></section>`; }).join("")}</div><div class="hdots">${W.slides.map((_, k) => `<button data-k="${k}" aria-label="Card ${k + 1}"></button>`).join("")}</div><button class="hx-x" aria-label="Close">✕</button><div class="hhint">Scroll ↓</div>`;
  document.body.appendChild(hx);
  document.body.style.overflow = "hidden";
  const dk = hx.querySelector(".hd"), secs = [...dk.children], dots = [...hx.querySelectorAll(".hdots button")], bg = hx.querySelector(".hbg"), hint = hx.querySelector(".hhint");
  let act = -1, done = false, closing = false;
  bg.style.background = bgOf(W.slides[i0]);
  dk.scrollTop = i0 * dk.clientHeight;
  const tick = () => {
    const vh = dk.clientHeight;
    secs.forEach((s, k) => {
      const p = Math.max(-1, Math.min(1, (s.offsetTop - dk.scrollTop) / vh));
      s.firstChild.style.transform = `translateY(${p * -50}px) scale(${1 - Math.abs(p) * 0.15}) rotate(${p * 5}deg)`;
      s.lastChild.style.transform = `translateY(${p * 80}px)`;
      s.lastChild.style.opacity = 1 - Math.abs(p) * 0.9;
    });
  };
  const setAct = (k) => {
    if (k === act || k < 0) return;
    act = k;
    FX.set.add("hero.bg");
    if (cfg.anim) anime({ targets: bg, backgroundColor: bgOf(W.slides[k]), duration: 900, easing: "easeInOutQuad" }); else bg.style.background = bgOf(W.slides[k]);
    FX.set.add("hero.dots");
    anime({ targets: dots, scale: (e, j) => (j === k ? 1.8 : 1), opacity: (e, j) => (j === k ? 1 : 0.4), duration: 400, easing: "easeOutBack" });
    pEnter(secs[k], k);
  };
  const go = (k) => dk.scrollTo({ top: Math.max(0, Math.min(secs.length - 1, k)) * dk.clientHeight, behavior: "smooth" });
  dk.addEventListener("scroll", () => { if (done) { requestAnimationFrame(tick); hint.style.display = "none"; } });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && done) setAct(secs.indexOf(e.target)); }), { root: dk, threshold: 0.35 });
  secs.forEach((s) => io.observe(s));
  dots.forEach((d) => { d.onclick = () => go(+d.dataset.k); });
  const key = (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown" || e.key === "PageDown") go(act + 1);
    else if (e.key === "ArrowUp" || e.key === "PageUp") go(act - 1);
    else { e.stopPropagation(); return; }
    e.preventDefault();
    e.stopPropagation();
  };
  document.addEventListener("keydown", key, true);
  const close = () => {
    if (closing) return;
    closing = true;
    const k = Math.max(0, act), from = secs[k].querySelector(".sc").getBoundingClientRect();
    dk.style.visibility = "hidden";
    hx.querySelectorAll(".hdots,.hx-x,.hhint").forEach((e) => { e.style.display = "none"; });
    document.body.style.overflow = "";
    document.removeEventListener("keydown", key, true);
    const t = document.querySelector(`.sgrid .sc[data-i="${k}"]`);
    const fin = () => { anime.remove(hx.querySelectorAll("*")); hx.remove(); document.querySelectorAll(".sgrid .sc").forEach((c) => { c.style.visibility = ""; }); };
    if (!t) return fin();
    t.scrollIntoView({ block: "center" });
    t.style.visibility = "hidden";
    FX.set.add("hero.bgout");
    anime({ targets: bg, opacity: 0, duration: 950, easing: "linear" });
    flip(W.slides[k], from, t.getBoundingClientRect(), fin);
  };
  hx.querySelector(".hx-x").onclick = close;
  hx.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (!a) return;
    if (a.dataset.act === "play") playMany(W.s.tracks.slice(0, 30).map((t) => t.uri));
    else if (a.dataset.act === "save") savePlaylist(`Top tracks · ${W.label}`, W.s.tracks.slice(0, 30).map((t) => t.uri));
    else shareCard(W.label, W.s);
  });
  const reveal = () => {
    dk.style.visibility = "visible";
    done = true;
    tick();
    setAct(i0);
    if (cfg.anim) {
      FX.set.add("hero.hint");
      anime({ targets: hint, translateY: [0, 10], loop: true, direction: "alternate", duration: 700, easing: "easeInOutSine" });
      FX.set.add("hero.dotsin");
      anime({ targets: dots, translateX: [30, 0], opacity: [0, 0.4], delay: anime.stagger(50), duration: 700 });
    }
  };
  const to = secs[i0].querySelector(".sc").getBoundingClientRect();
  const src = document.querySelector(`.sgrid .sc[data-i="${i0}"]`);
  if (src && cfg.anim) {
    const f = src.getBoundingClientRect();
    src.style.visibility = "hidden";
    FX.set.add("hero.bgin");
    anime({ targets: bg, opacity: [0, 1], duration: 900, easing: "linear" });
    flip(W.slides[i0], f, to, reveal);
  } else reveal();
};
