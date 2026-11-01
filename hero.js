(() => {
  if (cfg.accent === "#ff8800") { cfg.accent = "#007aff"; applyCfg(); }
  if (!SWATCHES.includes("#007aff")) SWATCHES.unshift("#007aff");

  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const NAV = {
    wrapped: ["Home", I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>')],
    now: ["Now", I('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>')],
    track: ["Tracks", I('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>')],
    artist: ["Artists", I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>')],
    album: ["Albums", I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>')],
    wrap: ["Wrapped", I('<path d="M12 3l2.3 5.7L20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3z"/>')],
    search: ["Search", I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>')],
    library: ["Library", I('<path d="M4 4v16M9 4v16"/><path d="M14 5l5 1-3 14-5-1z"/>')],
    profile: ["Profile", I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.5-2 3.2-3 5.5-3s4 1 5.5 3"/>')],
    stats: ["Stats", I('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>')],
    settings: ["Settings", I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>')],
  };
  document.querySelectorAll("#tabs button").forEach((b) => {
    const n = NAV[b.dataset.tab];
    if (!n) return;
    b.title = n[0];
    b.innerHTML = `<span class="ico">${n[1]}</span><em>${n[0]}</em>`;
  });

  const hello = $("#hello");
  const setHello = () => {
    const name = ((me && me.display_name) || "").split(" ")[0] || "there";
    let i = 0;
    const chars = (s) => [...s].map((c) => `<span class="ch" style="--i:${i++}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    hello.innerHTML = `${chars("Hello, ")}<b>${chars(name)}</b>${chars("!")}`;
    const img = me && me.images && me.images[0] && me.images[0].url;
    const av = $("#avatar");
    if (img) { av.src = img; av.hidden = false; }
  };
  setHello();
  if (localStorage.getItem("refresh")) api("/me").then((x) => { me = x; setHello(); }).catch(() => {});

  const gq = $("#gq");
  gq.addEventListener("input", () => {
    if (tab !== "search") { tab = "search"; render(); gq.focus(); }
    const q = $("#q");
    if (q) { q.value = gq.value; q.dispatchEvent(new Event("input")); }
  });

  const themeBtn = $("#themeBtn");
  const isDark = () => cfg.mode === "dark" || (cfg.mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  const paintTheme = () => { themeBtn.innerHTML = icon(isDark() ? "sun" : "moon"); };
  themeBtn.onclick = () => { cfg.mode = isDark() ? "light" : "dark"; applyCfg(); paintTheme(); };
  paintTheme();

  function paintArt() {
    document.querySelectorAll("[data-k]").forEach((el) => {
      const u = lib.art[el.dataset.k];
      if (u && el.tagName !== "IMG") el.outerHTML = `<img class="cover round" src="${esc(u)}" alt="" data-k="${esc(el.dataset.k)}">`;
    });
    const f = document.querySelector(".hfeat");
    if (f && lib.art[f.dataset.an]) {
      let im = f.querySelector("img.fi");
      if (!im) { im = document.createElement("img"); im.className = "fi"; im.alt = ""; f.prepend(im); }
      if (im.getAttribute("src") !== lib.art[f.dataset.an]) im.src = lib.art[f.dataset.an];
    }
  }

  function homeHtml(s) {
    const a0 = s.artists[0];
    const mine = [...a0.t.entries()].sort((x, y) => y[1] - x[1]);
    const img = lib.art[a0.name] || (mine[0] && lib.meta[mine[0][0]] && lib.meta[mine[0][0]].img) || "";
    const hrs = Math.round(a0.ms / 36e5);
    const top = s.artists.slice(0, 6);
    const alb = s.albums.slice(0, 4);
    return `<section class="home">
      <div class="hfeat" data-an="${esc(a0.name)}">
        ${img ? `<img class="fi" src="${esc(img)}" alt="">` : ""}
        <div class="ghost">${esc(a0.name.slice(0, 6))}</div>
        <span class="pill">${icon("fire")} On repeat</span>
        <h2>Turn up the volume with ${esc(a0.name)}</h2>
        <p>${fmtNum(a0.c)} plays and ${hrs} hour${hrs === 1 ? "" : "s"} together. Step back into it.</p>
        <button class="hplay" id="hfPlay">${icon("play")} Play</button>
      </div>
      <div class="card pad">
        <div class="sech"><h3>Your Top Artists</h3><button id="hMoreA">See More ›</button></div>
        <div class="hlist">${top.map((a, i) => `<div class="hrow" data-ai="${i}">${coverHtml(lib.art[a.name] || "", a.name, true, `data-k="${esc(a.name)}"`)}<div class="meta"><div class="t">${esc(a.name)}</div><div class="s">${fmtNum(a.c)} plays</div></div><span class="chev">›</span></div>`).join("")}</div>
      </div>
    </section>
    <div class="sech" style="margin-bottom:0"><h3>Listening Highlights</h3><button id="hMoreL">See More ›</button></div>
    <div class="hgrid">${alb.map((l) => `<div class="hcard"><div class="imgw">${coverHtml((lib.meta[l.uri] && lib.meta[l.uri].img) || "", l.name, false, `data-u="${esc(l.uri)}"`)}<span class="pp">${icon("play")}</span></div><div class="t">${esc(l.name)}</div><div class="s">${esc(l.artist)}</div></div>`).join("")}</div>
    <div class="sech" style="margin-bottom:0"><h3>Artist spotlights</h3></div>`;
  }

  const baseWrapped = renderWrapped;
  renderWrapped = function () {
    baseWrapped();
    const s = compute();
    if (!s.n) return;
    const v = $("#view");
    v.insertAdjacentHTML("afterbegin", homeHtml(s));
    const a0 = s.artists[0];
    const mine = [...a0.t.entries()].sort((x, y) => y[1] - x[1]).slice(0, 50).map((x) => x[0]);
    $("#hfPlay").onclick = (e) => { e.stopPropagation(); playMany(mine); };
    $("#hMoreA").onclick = () => { tab = "artist"; render(); };
    $("#hMoreL").onclick = () => { tab = "album"; render(); };
    v.querySelectorAll(".hrow").forEach((r) => { r.onclick = () => openArtistHero(+r.dataset.ai); });
    fillImages(s.albums.slice(0, 4).map((l) => ({ uri: l.uri, img: lib.meta[l.uri] && lib.meta[l.uri].img })), "track");
    fillImages(s.artists.slice(0, 6).map((a) => ({ t: a.name, img: lib.art[a.name] })), "artist");
    [400, 1400, 3200, 7000].forEach((ms) => setTimeout(paintArt, ms));
  };

  const SEL = [".home > *", ".sech", ".hcard", "#view > .card", "#view > .head", "#view > h2", "#view > h3", "#view > .sub", "#view > .g2 > *", "#view > .g4 > *", "#view > .tiles > *", "#view > .hero", "#view > .actions", "#view > div > .card", "#view .card > .row"].join(",");
  const view = $("#view");
  new MutationObserver(() => {
    if (!cfg.anim) return;
    let i = 0;
    view.querySelectorAll(SEL).forEach((el) => {
      if (el.classList.contains("rise") || el.classList.contains("rise-s") || el.closest(".wrapped-card")) return;
      el.style.setProperty("--i", Math.min(i++, 18));
      el.classList.add(el.classList.contains("row") ? "rise-s" : "rise");
    });
  }).observe(view, { childList: true });

  const SPOT = ".card,.big,.tile,.hfeat,.badge,.feat,.hcard,.hrow";
  const MAG = ".hplay,.btn,#pp,.nhx-controls .primary";
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !e.target.closest) return;
    const t = e.target.closest(SPOT);
    if (t) {
      const r = t.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      t.style.setProperty("--mx", `${x}px`);
      t.style.setProperty("--my", `${y}px`);
      if (t.classList.contains("hcard") || t.classList.contains("hfeat")) {
        const k = t.classList.contains("hfeat") ? 0.5 : 1;
        t.style.setProperty("--rx", `${(0.5 - y / r.height) * 10 * k}deg`);
        t.style.setProperty("--ry", `${(x / r.width - 0.5) * 12 * k}deg`);
      }
    }
    const m = e.target.closest(MAG);
    if (m) {
      const r = m.getBoundingClientRect();
      m.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.22}px ${(e.clientY - (r.top + r.height / 2)) * 0.3}px`;
    }
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    if (!e.target.closest) return;
    const t = e.target.closest(".hcard,.hfeat");
    if (t && !t.contains(e.relatedTarget)) { t.style.removeProperty("--rx"); t.style.removeProperty("--ry"); }
    const m = e.target.closest(MAG);
    if (m && !m.contains(e.relatedTarget)) m.style.translate = "";
  });

  if (!$("#app").hidden) render();
})();