/* Framefly site runtime: countdown, nav, forms, reveals. No framework, no scroll listeners. */
(function () {
  "use strict";
  var C = window.FRAMEFLY || {};
  var LAUNCH = new Date(C.launchAt || "2026-10-28T07:01:00Z").getTime();
  var FPS = 24;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FF = (window.FF = window.FF || {});
  FF.reduce = reduce;
  FF.icon = function (name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="assets/img/icons.svg#i-' + name + '"></use></svg>';
  };

  /* ───────── Countdown ───────── */
  function remaining(now) {
    var ms = Math.max(0, LAUNCH - (now || Date.now()));
    var s = Math.floor(ms / 1000);
    return {
      ms: ms,
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60,
      f: Math.floor((ms % 1000) / (1000 / FPS)),
    };
  }
  FF.remaining = remaining;
  FF.isLive = function () { return Date.now() >= LAUNCH; };
  var pad = function (n, l) { n = String(n); while (n.length < (l || 2)) n = "0" + n; return n; };

  // Seven-segment digits: which segments are lit for 0 to 9.
  var SEG = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
  function digitEl() {
    var d = document.createElement("span");
    d.className = "digit";
    "abcdefg".split("").forEach(function (k) { var i = document.createElement("i"); i.className = k; d.appendChild(i); });
    d._v = -1;
    return d;
  }
  function setDigit(d, v) {
    if (d._v === v) return;
    d._v = v;
    var on = SEG[v] || "";
    for (var i = 0; i < 7; i++) { var seg = d.children[i]; seg.classList.toggle("on", on.indexOf(seg.className.charAt(0)) > -1); }
  }
  function buildLed(el) {
    var groups = (el.getAttribute("data-led") || "d h m s f").split(" ");
    el.innerHTML = "";
    el._groups = {};
    groups.forEach(function (g, gi) {
      if (gi) { var c = document.createElement("span"); c.className = "led-colon"; el.appendChild(c); }
      var grp = document.createElement("span");
      grp.className = "led-group " + (g === "f" ? "frm" : "");
      grp.appendChild(digitEl()); grp.appendChild(digitEl());
      el.appendChild(grp);
      el._groups[g] = grp;
    });
  }
  function paintLed(el, r) {
    Object.keys(el._groups).forEach(function (g) {
      var grp = el._groups[g];
      var val = g === "f" && reduce ? "00" : pad(r[g], 2);
      while (grp.children.length < val.length) grp.insertBefore(digitEl(), grp.firstChild);
      while (grp.children.length > val.length && grp.children.length > 2) grp.removeChild(grp.firstChild);
      for (var i = 0; i < val.length; i++) setDigit(grp.children[i], +val.charAt(i));
    });
  }

  var leds = $$("[data-led]");
  leds.forEach(buildLed);
  var visibleLeds = new Set(leds);
  if ("IntersectionObserver" in window) {
    var ledIO = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? visibleLeds.add(e.target) : visibleLeds.delete(e.target); }); });
    leds.forEach(function (l) { ledIO.observe(l); });
  }

  var fmtDate = function (o) { try { return new Intl.DateTimeFormat(undefined, o).format(new Date(LAUNCH)); } catch (e) { return new Date(LAUNCH).toDateString(); } };
  $$("[data-launch-local]").forEach(function (t) {
    t.textContent = fmtDate({ weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
    t.setAttribute("datetime", new Date(LAUNCH).toISOString());
  });
  $$("[data-launch-date]").forEach(function (t) { t.textContent = fmtDate({ month: "long", day: "numeric" }); });
  $$("[data-launch-short]").forEach(function (t) {
    // Slate style: 28 OCT 26
    var d = new Date(LAUNCH);
    t.textContent = String(d.getUTCDate()).padStart(2, "0") + " " + ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2);
  });
  $$("[data-launch-weekday]").forEach(function (t) { t.textContent = fmtDate({ weekday: "long", month: "long", day: "numeric" }); });

  var chips = $$("[data-cd-chip]");
  var srs = $$("[data-cd-sr]");
  var lastSec = -1;
  var wasLive = null;
  function tick() {
    var r = remaining();
    var live = r.ms === 0;
    if (live !== wasLive) { wasLive = live; setLive(live); }
    visibleLeds.forEach(function (l) { paintLed(l, r); });
    if (r.s !== lastSec || live) {
      lastSec = r.s;
      var txt = live ? "Live now" : r.d + "d " + pad(r.h) + "h " + pad(r.m) + "m " + pad(r.s) + "s";
      chips.forEach(function (c) { c.textContent = txt; });
      srs.forEach(function (c) { c.textContent = live ? "Framefly has launched." : "Framefly launches in " + r.d + " days, " + r.h + " hours and " + r.m + " minutes."; });
    }
  }
  function setLive(live) {
    document.documentElement.toggleAttribute("data-live", live);
    $$("[data-when-live]").forEach(function (e) { e.hidden = !live; });
    $$("[data-when-waiting]").forEach(function (e) { e.hidden = live; });
    $$(".slate").forEach(function (s) { s.setAttribute("data-live", String(live)); });
    $$("[data-app-link]").forEach(function (a) { a.href = C.appUrl || a.href; });
  }
  leds.forEach(function (l) { paintLed(l, remaining()); });
  tick();
  if (reduce) setInterval(tick, 1000);
  else (function loop() { tick(); requestAnimationFrame(loop); })();

  // The slate claps when you press it, like on set.
  $$(".slate").forEach(function (s) {
    s.addEventListener("click", function () {
      if (s.getAttribute("data-live") === "true") return;
      s.setAttribute("data-clap", "true");
      setTimeout(function () { s.removeAttribute("data-clap"); }, 160);
    });
  });

  /* ───────── Nav ───────── */
  var nav = $("#nav");
  if (nav && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;left:0;height:24px;width:1px;pointer-events:none";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (es) { nav.setAttribute("data-scrolled", String(!es[0].isIntersecting)); }).observe(sentinel);
  }
  // On the home page the chip hides while the big slate is on screen.
  var premiere = $("#premiere");
  var chip = $(".nav-count");
  if (premiere && chip && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { chip.setAttribute("data-hidden", String(es[0].isIntersecting)); }, { threshold: 0.2 }).observe(premiere);
  }
  var toggle = $(".nav-toggle");
  var menu = $("#menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = FF.icon(open ? "x" : "list");
      menu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) { toggle.click(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) toggle.click(); });
  }

  /* ───────── Reveals ───────── */
  var reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (r) { rio.observe(r); });
    // Never leave content hidden if an observer misses it.
    setTimeout(function () { reveals.forEach(function (r) { r.classList.add("in"); }); }, 4000);
  } else reveals.forEach(function (r) { r.classList.add("in"); });

  // Generic "in view" hook for animated blocks (stage bars and demos start when seen).
  FF.onView = function (el, fn, opts) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting, e); }); }, opts || { threshold: 0.25 }).observe(el);
  };
  $$("[data-in]").forEach(function (el) {
    FF.onView(el, function (v) { if (v) el.classList.add("in"); });
  });

  /* ───────── Forms ───────── */
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
    var ok = true;
    var first = null;
    $$("[data-required]", form).forEach(function (el) {
      var name = el.getAttribute("data-required");
      var val = data[name];
      var msg = "";
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
      // Not wired yet in production: hand the visitor a ready email so nobody is lost.
      var lines = Object.keys(payload).map(function (k) { return k + ": " + [].concat(payload[k]).join(", "); }).join("\n");
      location.href = "mailto:" + (C.contactEmail || "support@framefly.app") + "?subject=" + encodeURIComponent(payload.type === "beta" ? "Beta application" : "Notify me at launch") + "&body=" + encodeURIComponent(lines);
      return Promise.resolve();
    }
    console.info("[Framefly] formEndpoint is empty, so nothing was sent. Payload:", payload);
    return new Promise(function (res) { setTimeout(res, 700); });
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
          var focusEl = done.querySelector("[tabindex]") || done;
          if (focusEl.focus) focusEl.focus();
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

  /* ───────── Small things ───────── */
  $$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
  $$("[data-contact]").forEach(function (a) { a.textContent = C.contactEmail; a.href = "mailto:" + C.contactEmail; });
  $$("[data-x]").forEach(function (a) { a.href = C.xUrl; });
  if (C.preorderUrl) $$("[data-preorder]").forEach(function (b) { b.hidden = false; var a = b.querySelector("a[data-preorder-link]"); if (a) a.href = C.preorderUrl; });

  // Table of contents highlight (product page).
  var toc = $(".toc");
  if (toc && "IntersectionObserver" in window) {
    var links = $$("a", toc);
    var map = {};
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) map[s.id] = a; });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = map[e.target.id];
        if (a) {
          a.setAttribute("aria-current", "true");
          toc.scrollTo({ left: a.offsetLeft - toc.clientWidth / 2 + a.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { tio.observe(document.getElementById(id)); });
  }
})();
