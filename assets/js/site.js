/* Framefly site runtime: theme, countdown, nav, forms, film players, reveals. No framework, no scroll listeners. */
(function () {
  "use strict";
  var C = window.FRAMEFLY || {};
  var D = window.FF_DATA || {};
  var LAUNCH = new Date(C.launchAt || "2026-10-28T07:01:00Z").getTime();
  var root = document.documentElement;
  var ROOT = root.getAttribute("data-root") || ""; // "../" on a page in a folder (an article)
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FF = (window.FF = window.FF || {});
  FF.reduce = reduce;
  FF.$ = $;
  FF.$$ = $$;
  FF.icon = function (name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="' + ROOT + 'assets/img/icons.svg#i-' + name + '"></use></svg>';
  };
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  var clock = function (s) { s = Math.max(0, s); return Math.floor(s / 60) + ":" + pad(Math.floor(s % 60)); };
  FF.clock = clock;
  /** One of several: marks the pressed button of a group, tells the rest they are not. */
  FF.choose = function (group, btn, attr) {
    $$("button", group).forEach(function (b) { b.setAttribute(attr || "aria-checked", String(b === btn)); });
  };
  FF.onView = function (el, fn, opts) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting, e); }); }, opts || { threshold: 0.25 }).observe(el);
  };

  /* ───────── Theme: light, unless the visitor chose dark ───────── */
  $$("[data-theme-toggle]").forEach(function (b) {
    var label = function () { b.setAttribute("aria-label", root.getAttribute("data-theme") === "dark" ? "Switch to the light theme" : "Switch to the dark theme"); };
    label();
    b.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("framefly.site.theme", next); } catch (e) {}
      label();
    });
  });

  /* ───────── Countdown, and what changes on launch day ───────── */
  function remaining() {
    var ms = Math.max(0, LAUNCH - Date.now());
    var s = Math.floor(ms / 1000);
    return { ms: ms, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  }
  var fmt = function (o) { try { return new Intl.DateTimeFormat("en", o).format(new Date(LAUNCH)); } catch (e) { return new Date(LAUNCH).toDateString(); } };
  $$("[data-launch-date]").forEach(function (t) { t.textContent = fmt({ month: "long", day: "numeric" }); });
  $$("[data-launch-weekday]").forEach(function (t) { t.textContent = fmt({ weekday: "long", month: "long", day: "numeric" }); });
  var chips = $$("[data-cd-chip]"), units = $$("[data-cd]"), srs = $$("[data-cd-sr]");
  var wasLive = null, lastMin = -1;
  function setLive(live) {
    root.toggleAttribute("data-live", live);
    $$("[data-when-live]").forEach(function (e) { e.hidden = !live; });
    $$("[data-when-waiting]").forEach(function (e) { e.hidden = live; });
    $$("[data-app-link]").forEach(function (a) { a.href = C.appUrl || a.href; });
  }
  function tick() {
    var r = remaining(), live = r.ms === 0;
    if (live !== wasLive) { wasLive = live; setLive(live); }
    if (live) return;
    units.forEach(function (u) { var v = pad(r[u.getAttribute("data-cd")]); if (u.textContent !== v) u.textContent = v; });
    var chip = r.d > 0 ? r.d + "d " + pad(r.h) + "h " + pad(r.m) + "m" : pad(r.h) + ":" + pad(r.m) + ":" + pad(r.s);
    chips.forEach(function (c) { if (c.textContent !== chip) c.textContent = chip; });
    if (r.m !== lastMin) { lastMin = r.m; srs.forEach(function (c) { c.textContent = "Framefly launches in " + r.d + " days, " + r.h + " hours and " + r.m + " minutes."; }); }
  }
  tick();
  setInterval(tick, 1000);

  /* ───────── Nav ───────── */
  var toggle = $(".nav-toggle"), menu = $("#menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close the menu" : "Open the menu");
      menu.hidden = !open;
    };
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });
  }

  /* ───────── Reveals ───────── */
  var reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    reveals.forEach(function (r) { rio.observe(r); });
    // never leave anything hidden if an observer misses it
    setTimeout(function () { reveals.forEach(function (r) { r.classList.add("in"); }); }, 3500);
  } else reveals.forEach(function (r) { r.classList.add("in"); });

  /* ───────── Forms (the payloads are described in README.md) ───────── */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function setErr(form, name, msg) {
    var box = form.querySelector('[data-err="' + name + '"]');
    var well = form.querySelector('[data-well="' + name + '"]');
    if (box) { box.hidden = !msg; box.querySelector("span").textContent = msg || ""; }
    if (well) well.setAttribute("data-invalid", String(!!msg));
  }
  function collect(form) {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (data[k] !== undefined) data[k] = [].concat(data[k], v);
      else data[k] = typeof v === "string" ? v.trim() : v;
    });
    return data;
  }
  function validate(form, data) {
    var ok = true, first = null;
    $$("[data-required]", form).forEach(function (el) {
      var name = el.getAttribute("data-required"), val = data[name], msg = "";
      if (!val || (Array.isArray(val) && !val.length)) msg = el.getAttribute("data-msg") || "This one is needed.";
      else if (name === "email" && !EMAIL.test(val)) msg = "That email looks incomplete. Check for a typo after the @.";
      else if (name === "app_url" && !/\.[a-z]{2,}/i.test(val) && !/localhost/i.test(val)) msg = "Add the full address, for example app.yourproduct.com.";
      setErr(form, name, msg);
      if (msg) { ok = false; if (!first) first = form.querySelector('[name="' + name + '"]'); }
    });
    if (first) first.focus();
    return ok;
  }
  function send(payload) {
    var endpoint = (C.formEndpoint || "").trim();
    if (endpoint) {
      return fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r; });
    }
    if (/framefly\.app$/.test(location.hostname)) {
      // not wired yet in production: hand the visitor a ready email so nobody is lost
      var lines = Object.keys(payload).map(function (k) { return k + ": " + [].concat(payload[k]).join(", "); }).join("\n");
      location.href = "mailto:" + (C.contactEmail || "support@framefly.app") + "?subject=" + encodeURIComponent(payload.type === "beta" ? "Beta application" : "Notify me at launch") + "&body=" + encodeURIComponent(lines);
      return Promise.resolve();
    }
    console.info("[Framefly] formEndpoint is empty, so nothing was sent. Payload:", payload);
    return new Promise(function (res) { setTimeout(res, 600); });
  }
  $$("form[data-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("input", function (e) { var n = e.target.name; if (n) setErr(form, n, ""); var fe = form.querySelector("[data-form-error]"); if (fe) fe.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = collect(form);
      if (data.company) return; // honeypot
      if (!validate(form, data)) return;
      var btn = form.querySelector('[type="submit"]');
      btn.setAttribute("data-busy", "true");
      btn.disabled = true;
      var payload = Object.assign({ type: form.getAttribute("data-form"), page: location.pathname, sentAt: new Date().toISOString() }, data);
      delete payload.company;
      send(payload).then(function () {
        var done = document.getElementById(form.getAttribute("data-done"));
        if (done) {
          $$("[data-echo-email]", done).forEach(function (s) { s.textContent = data.email; });
          done.hidden = false;
          form.hidden = true;
          if (done.focus) done.focus();
        }
      }).catch(function () {
        var fe = form.querySelector("[data-form-error]");
        if (fe) fe.hidden = false;
      }).then(function () {
        btn.removeAttribute("data-busy");
        btn.disabled = false;
      });
    });
  });

  /* ───────── Film players ───────── */
  var films = {};
  (D.templates || []).forEach(function (t) { films[t.id] = t; });
  // the smaller file on phones, on data-saving connections, or when the player itself is small
  function fileOf(id, el) {
    var conn = navigator.connection || {};
    var small = conn.saveData || /2g|3g/.test(conn.effectiveType || "") || el.clientWidth * (window.devicePixelRatio || 1) < 1000;
    return ROOT + "assets/films/" + id + (small ? ".720" : ".1080") + ".mp4";
  }
  function Player(el) {
    var v = $("video", el), track = $("[data-track]", el), time = $("[data-time]", el), note = $("[data-note]", el), soundBtn = $("[data-sound-btn]", el);
    var id = el.getAttribute("data-film"), loaded = false, wanted = false, visible = false, dragging = false;
    var load = function () {
      if (loaded) return;
      loaded = true;
      v.src = fileOf(id, el);
    };
    var state = function () {
      el.setAttribute("data-state", v.paused ? "paused" : "playing");
      el.setAttribute("data-muted", String(v.muted));
      $$("[data-play]", el).forEach(function (b) { b.setAttribute("aria-label", v.paused ? "Play" : "Pause"); });
      if (soundBtn) soundBtn.setAttribute("aria-label", v.muted ? "Turn the sound on" : "Turn the sound off");
    };
    var play = function () { load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var paint = function () {
      var d = v.duration || (films[id] && films[id].film.seconds) || 0;
      var p = d ? v.currentTime / d : 0;
      track.style.setProperty("--p", p.toFixed(4));
      track.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      time.textContent = clock(v.currentTime) + " / " + clock(d);
    };
    $$("[data-play]", el).forEach(function (b) {
      b.addEventListener("click", function () { if (v.paused) { wanted = true; play(); } else { wanted = false; v.pause(); } });
    });
    v.addEventListener("click", function () { if (v.paused) { wanted = true; play(); } else { wanted = false; v.pause(); } });
    ["play", "pause", "volumechange"].forEach(function (ev) { v.addEventListener(ev, state); });
    v.addEventListener("timeupdate", function () { if (!dragging) paint(); });
    v.addEventListener("loadedmetadata", paint);
    if (soundBtn) soundBtn.addEventListener("click", function () { v.muted = !v.muted; if (!v.muted && v.paused) { wanted = true; play(); } });
    var full = $("[data-full]", el);
    if (full) full.addEventListener("click", function () {
      load();
      var s = $(".player-screen", el);
      if (document.fullscreenElement) document.exitFullscreen();
      else if (s.requestFullscreen) s.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    var seek = function (e) {
      var r = track.getBoundingClientRect(), p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      load();
      var go = function () { if (v.duration) { v.currentTime = p * v.duration; paint(); } };
      if (v.readyState >= 1) go(); else v.addEventListener("loadedmetadata", go, { once: true });
    };
    track.addEventListener("pointerdown", function (e) { dragging = true; track.setPointerCapture(e.pointerId); seek(e); });
    track.addEventListener("pointermove", function (e) { if (dragging) seek(e); });
    ["pointerup", "pointercancel"].forEach(function (ev) { track.addEventListener(ev, function () { dragging = false; }); });
    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      load();
      if (v.duration) v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + (e.key === "ArrowLeft" ? -2 : 2)));
    });
    // it plays while it is on screen, if it was asked to (or is the page's opening film), and rests otherwise
    var auto = el.hasAttribute("data-autoplay") && !reduce;
    FF.onView(el, function (on) {
      visible = on;
      if (on && (auto || wanted)) play();
      else if (!on && !v.paused) v.pause();
    }, { threshold: 0.35 });
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); else if (visible && (auto || wanted)) play(); });
    state();
    return {
      /** Another film in the same player. */
      show: function (next) {
        var t = films[next];
        if (!t || next === id) return;
        id = next;
        loaded = false;
        el.setAttribute("data-film", id);
        el.style.setProperty("--ar", t.film.w + " / " + t.film.h);
        v.muted = true;
        v.poster = ROOT + "assets/films/" + id + ".webp";
        v.removeAttribute("src");
        v.load();
        if (note) note.textContent = t.film.full ? "" : "Opening of a " + clock(t.film.filmSeconds) + " film";
        if (soundBtn) soundBtn.hidden = !t.film.sound;
        track.style.setProperty("--p", "0");
        time.textContent = "0:00 / " + clock(t.film.seconds);
        wanted = true;
        if (visible && !reduce) play(); else state();
      },
    };
  }
  var players = $$("[data-player]").map(function (el) { el._player = Player(el); return el._player; });

  /* ───────── Hero: pick a template, the brief and the film change together ───────── */
  $$("[data-inout]").forEach(function (box) {
    var brief = $("[data-brief]", box), pl = $("[data-player]", box), typing = 0;
    $$("[data-template]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var t = films[b.getAttribute("data-template")];
        if (!t) return;
        FF.choose(b.parentNode, b);
        pl._player.show(t.id);
        clearInterval(typing);
        if (reduce) { brief.textContent = t.brief; return; }
        // the brief is typed in, as it is in Studio
        var i = 0;
        brief.textContent = "";
        typing = setInterval(function () {
          i += 4;
          brief.textContent = t.brief.slice(0, i);
          if (i >= t.brief.length) clearInterval(typing);
        }, 16);
      });
    });
  });

  /* ───────── How it works: the step in the middle of the window shows its picture ───────── */
  $$("[data-steps]").forEach(function (box) {
    var steps = $$(".step", box), shots = $$(".steps-stage .shot", box);
    if (!steps.length || !("IntersectionObserver" in window)) return;
    var set = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      shots.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    };
    set(0);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(steps.indexOf(e.target)); });
    }, { rootMargin: "-48% 0px -48% 0px" });
    steps.forEach(function (s) { io.observe(s); });
  });

  /* ───────── Table of contents (product page) ───────── */
  var toc = $(".toc") || $(".rail-toc");
  if (toc && "IntersectionObserver" in window) {
    var links = $$("a", toc), map = {};
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) map[s.id] = a; });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = map[e.target.id];
        if (a) { a.setAttribute("aria-current", "true"); toc.scrollTo({ left: a.offsetLeft - toc.clientWidth / 2 + a.clientWidth / 2, behavior: reduce ? "auto" : "smooth" }); }
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { tio.observe(document.getElementById(id)); });
  }

  var fine = window.matchMedia && !window.matchMedia("(pointer: coarse)").matches;

  /* ───────── The buttons that matter: letters that roll, ink from where the pointer came in, a pull toward it ───────── */
  $$(".btn-primary").forEach(function (b) {
    if (!reduce) {
      Array.prototype.slice.call(b.childNodes).forEach(function (n) {
        var text = n.nodeType === 3 ? n.nodeValue.trim() : "";
        if (!text) return;
        var roll = document.createElement("span"), sr = document.createElement("span");
        roll.className = "roll";
        roll.setAttribute("aria-hidden", "true");
        text.split("").forEach(function (c, i) {
          var ch = document.createElement("span");
          ch.className = "ch";
          ch.style.setProperty("--i", i);
          ch.setAttribute("data-c", c === " " ? "\u00a0" : c);
          ch.textContent = c === " " ? "\u00a0" : c;
          roll.appendChild(ch);
        });
        sr.className = "sr-only";
        sr.textContent = text;
        b.replaceChild(roll, n);
        b.insertBefore(sr, roll);
      });
    }
    var from = function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty("--mx", (e.clientX - r.left) + "px");
      b.style.setProperty("--my", (e.clientY - r.top) + "px");
    };
    b.addEventListener("pointerenter", from);
    if (!fine || reduce) return;
    b.addEventListener("pointermove", function (e) {
      // measured without the pull, or the button would chase itself
      var r = b.getBoundingClientRect(), tx = parseFloat(b.style.getPropertyValue("--tx")) || 0, ty = parseFloat(b.style.getPropertyValue("--ty")) || 0;
      var x = e.clientX - (r.left - tx) - r.width / 2, y = e.clientY - (r.top - ty) - r.height / 2;
      b.setAttribute("data-pull", "");
      b.style.setProperty("--tx", (x * 0.16).toFixed(1) + "px");
      b.style.setProperty("--ty", (y * 0.28).toFixed(1) + "px");
    });
    b.addEventListener("pointerleave", function (e) {
      from(e);
      b.removeAttribute("data-pull");
      b.style.setProperty("--tx", "0px");
      b.style.setProperty("--ty", "0px");
    });
    FF.onView(b, function (inView) { b.classList.toggle("in-view", inView); }, { threshold: 0.9 });
  });

  /* ───────── Small things ───────── */
  $$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
  $$("[data-contact]").forEach(function (a) { a.textContent = C.contactEmail || a.textContent; a.href = "mailto:" + (C.contactEmail || "support@framefly.app"); });
  $$("[data-x]").forEach(function (a) { if (C.xUrl) a.href = C.xUrl; });
  if (C.preorderUrl) $$("[data-preorder]").forEach(function (b) { b.hidden = false; var a = b.querySelector("a[data-preorder-link]"); if (a) a.href = C.preorderUrl; });
  FF.players = players;
})();
