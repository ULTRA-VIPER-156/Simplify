(() => {
  const SCOPE_V = "4";
  const EXTRA = " streaming user-read-email user-read-private";

  login = async function () {
    const verifier = rand(48);
    const challenge = b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    localStorage.setItem("verifier", verifier);
    localStorage.setItem("scopeV", SCOPE_V);
    const p = new URLSearchParams({ client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT, scope: SCOPES + EXTRA, code_challenge_method: "S256", code_challenge: challenge });
    location.href = `https://accounts.spotify.com/authorize?${p}`;
  };
  $("#loginBtn").onclick = login;

  if (localStorage.getItem("refresh") && localStorage.getItem("scopeV") !== SCOPE_V) {
    $("#app").insertAdjacentHTML("afterbegin", `<div class="banner" id="reauth">Reconnect Spotify to play music inside the app <button id="reauthBtn">Reconnect</button></div>`);
    $("#reauthBtn").onclick = login;
  }

  let sdk = null, deviceId = null, unlocked = false;

  async function adopt() {
    try {
      const p = await api("/me/player");
      if (!p || !p.device) {
        await call("PUT", "/me/player", { device_ids: [deviceId], play: false });
        setTimeout(poll, 500);
      }
    } catch (e) {}
  }

  window.onSpotifyWebPlaybackSDKReady = () => {
    if (!localStorage.getItem("refresh")) return;
    sdk = new Spotify.Player({ name: "Stats for Spotify", volume: 0.7, getOAuthToken: (cb) => { token().then(cb).catch(() => {}); } });
    sdk.addListener("ready", ({ device_id }) => { deviceId = device_id; adopt(); });
    sdk.addListener("not_ready", () => { deviceId = null; });
    sdk.addListener("authentication_error", () => toast("Reconnect Spotify to play inside the app"));
    sdk.addListener("account_error", () => toast("Playing inside the app needs Spotify Premium"));
    sdk.addListener("player_state_changed", () => setTimeout(poll, 150));
    sdk.connect();
  };

  document.addEventListener("click", () => {
    if (sdk && !unlocked) { unlocked = true; if (sdk.activateElement) sdk.activateElement(); }
  }, true);

  playBody = async function (body) {
    let r = await call("PUT", "/me/player/play", body);
    if (r.status === 404) {
      let id = deviceId;
      if (!id) {
        let d = null;
        try { d = await api("/me/player/devices"); } catch (e) {}
        id = d && d.devices && d.devices[0] && d.devices[0].id;
      }
      if (!id) { toast("Open Spotify on a device first"); return; }
      r = await call("PUT", `/me/player/play?device_id=${id}`, body);
    }
    if (r.status === 403) toast("Playback needs Spotify Premium and a reconnect");
    setTimeout(poll, 450);
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("#pbar, .modal, .ahx, .nhx, button, a, input, .seg")) return;
    const row = e.target.closest(".row, .hcard");
    if (!row || row.querySelector("[data-k]")) return;
    const src = row.querySelector("[data-u], [data-p]");
    if (!src) return;
    const uri = src.dataset.u || src.dataset.p;
    if (e.shiftKey && uri.startsWith("spotify:track:")) { enqueue(uri); return; }
    if (!uri.startsWith("spotify:track:")) { play(uri); return; }
    const scope = row.closest(".card, .hgrid") || row.parentElement;
    const els = [...scope.querySelectorAll("[data-u]")].filter((x) => x.dataset.u.startsWith("spotify:track:"));
    const list = els.map((x) => x.dataset.u);
    const i = Math.max(0, els.indexOf(src));
    const start = Math.max(0, Math.min(i, list.length - 100));
    playBody({ uris: list.slice(start, start + 100), offset: { position: i - start } });
  });

  const st = { id: null, playing: false };
  function colors(it) {
    const image = it.album && it.album.images && (it.album.images[1] || it.album.images[0]);
    if (!image?.url) return;
    const trackId = it.id;
    nhExtractColor(image.url).then((color) => {
      if (st.id !== trackId || !color) return;
      const root = document.documentElement.style;
      root.setProperty("--song", color);
      root.setProperty("--song2", color);
      const aura = document.querySelector(".nhx-aura");
      if (aura) aura.style.setProperty("--aura-color", color);
    }).catch((error) => console.warn("Could not extract album artwork color", error));
  }
  function sync() {
    const track = ps && ps.item;
    st.playing = !!(track && ps.is_playing);
    document.body.classList.toggle("isplaying", st.playing);
    if (track && track.id !== st.id) {
      st.id = track.id;
      colors(track);
    }
  }

  $("#pbar .l").addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    openNowHero();
  });

  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType === 1 && n.classList.contains("nhx")) {
        const bg = n.querySelector(".nhx-bg");
        const aura = document.createElement("div");
        aura.className = "nhx-aura";
        aura.setAttribute("aria-hidden", "true");
        aura.innerHTML = "<i></i><i></i>";
        bg.insertBefore(aura, bg.querySelector(".vig"));
        aura.style.setProperty("--aura-color", getComputedStyle(document.documentElement).getPropertyValue("--song").trim());
        if (cfg.anim && typeof anime !== "undefined" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          anime({
            targets: aura.children,
            translateX: [-24, 24],
            translateY: [18, -18],
            scale: [0.92, 1.08],
            duration: 12000,
            delay: anime.stagger(900),
            direction: "alternate",
            easing: "easeInOutSine",
            loop: true,
          });
        }
      }
    }
  }).observe(document.body, { childList: true });

  setInterval(sync, 1000);
})();