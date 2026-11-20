/*
  The pitch deck (pitch.html). Slides are drawn at 1600 x 900 and scaled to their box.
  A slide reveals its [data-f] parts one click at a time; the demo slide steps the live dashboard instead.
  Keys: arrows, space, PageUp/PageDown (a presenter remote sends these), F fullscreen, P presenter view,
  N notes, S site, B black screen, ? help. The presenter view (pitch.html?presenter) follows and drives the
  deck through a BroadcastChannel; the site sends you back here with Escape (assets/js/present.js).
*/
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var W = 1600, H = 900;
  var PRESENTER = new URLSearchParams(location.search).has("presenter");
  var channel = "BroadcastChannel" in window ? new BroadcastChannel("framefly-pitch") : null;

  document.documentElement.setAttribute("data-theme", "light");
  document.body.classList.add(PRESENTER ? "presenter" : "deck-body");

  var DEMO_CAPS = [
    "L'app envoie sa vidéo. C'est la seule chose qu'on lui demande.",
    "L'IA en tire dix variantes. On n'en montre que les trois meilleures.",
    "Chaque variante reçoit 30 € de test sur Meta Ads, pendant 3 jours.",
    "On mesure jusqu'à l'abonné payant. Trois variantes passent devant.",
    "Le budget quitte les perdantes et va aux gagnantes. L'utilisateur valide.",
    "Les gagnantes lancent une nouvelle série. La boucle continue."
  ];

  // ── a deck view: one stage, its slides, the slide and the step it shows ──
  function View(stage, opts) {
    this.stage = stage;
    this.slides = $$(".slide", stage);
    this.box = stage.parentNode;
    this.opts = opts || {};
    this.i = -1; this.f = 0;
    var self = this;
    this.fit = function () {
      var r = self.box.getBoundingClientRect();
      var k = Math.min(r.width / W, r.height / H) || 1;
      stage.style.setProperty("--k", k);
    };
    this.fit();
    if ("ResizeObserver" in window) new ResizeObserver(this.fit).observe(this.box);
    window.addEventListener("resize", this.fit);
    this.slides.forEach(function (s, n) {
      var num = $(".s-num", s);
      if (num) num.textContent = pad(n + 1) + " / " + pad(self.slides.length);
    });
  }
  View.prototype.count = function (i) {
    var s = this.slides[i];
    if (!s) return 0;
    var max = +(s.getAttribute("data-frags") || 0);
    $$("[data-f]", s).forEach(function (e) { max = Math.max(max, +e.getAttribute("data-f")); });
    return max;
  };
  View.prototype.show = function (i, f) {
    var self = this, n = this.slides.length;
    i = Math.max(0, Math.min(n - 1, i));
    f = Math.max(0, Math.min(this.count(i), f));
    var changed = i !== this.i;
    this.slides.forEach(function (s, k) {
      s.classList.toggle("on", k === i);
      s.classList.toggle("past", k < i);
      s.setAttribute("aria-hidden", k === i ? "false" : "true");
    });
    $$("[data-f]", this.slides[i]).forEach(function (e) { e.classList.toggle("in", +e.getAttribute("data-f") <= f); });
    this.i = i; this.f = f;
    var bar = $(".bar i", this.stage);
    if (bar) bar.style.width = (n > 1 ? (i / (n - 1)) * 100 : 100) + "%";
    // the live dashboard: load it one slide ahead, then step it
    this.slides.forEach(function (s, k) {
      var fr = $("iframe[data-src]", s);
      if (fr && !self.opts.noFrames && Math.abs(k - i) <= 1 && !fr.getAttribute("src")) {
        fr.setAttribute("src", fr.getAttribute("data-src"));
        fr.addEventListener("load", function () { var w = $(".demo-wait", s); if (w) w.remove(); self.demo(s, k === self.i ? self.f : 0); });
      }
    });
    if (this.slides[i].hasAttribute("data-demo")) this.demo(this.slides[i], f);
    $$("[data-go-site]", this.stage).forEach(function (a) { a.href = a.href.replace(/pitch=\d+/, "pitch=" + (i + 1)); });
    return changed;
  };
  View.prototype.demo = function (s, f) {
    var fr = $("iframe", s);
    if (fr && fr.contentWindow) {
      try { fr.contentWindow.postMessage({ type: "theme", value: "dark" }, "*"); fr.contentWindow.postMessage({ type: "step", step: f }, "*"); } catch (e) {}
    }
    var cap = $("[data-demo-cap]", s);
    if (cap) cap.innerHTML = "<b>" + (f + 1) + " / 6</b>" + DEMO_CAPS[f];
    $$(".demo-dots i", s).forEach(function (d, k) { d.className = k < f ? "past" : k === f ? "on" : ""; });
  };
  View.prototype.after = function (i, f) {
    return f < this.count(i) ? [i, f + 1] : i < this.slides.length - 1 ? [i + 1, 0] : [i, f];
  };
  View.prototype.before = function (i, f) {
    return f > 0 ? [i, f - 1] : i > 0 ? [i - 1, this.count(i - 1)] : [0, 0];
  };

  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function notesOf(view, i) { var a = $(".notes", view.slides[i]); return a ? a.innerHTML : "<p>Pas de notes pour cette slide.</p>"; }
  function titleOf(view, i) { return view.slides[i] ? view.slides[i].getAttribute("data-title") : "Fin"; }

  if (PRESENTER) presenter(); else deck();

  // ───────── the deck, as the room sees it ─────────
  function deck() {
    var view = new View($("[data-stage]"));
    var m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
    view.show(m ? +m[1] - 1 : 0, m && m[2] ? +m[2] : 0);

    function go(pos, quiet) {
      view.show(pos[0], pos[1]);
      history.replaceState(null, "", "#" + (view.i + 1) + (view.f ? "." + view.f : ""));
      if (notesOn) notes();
      if (!quiet) broadcast();
    }
    function next() { go(view.after(view.i, view.f)); }
    function prev() { go(view.before(view.i, view.f)); }
    function broadcast() { if (channel) channel.postMessage({ type: "state", i: view.i, f: view.f }); }

    // overlays
    var notesOn = false, panel = $("[data-notes-panel]"), help = $("[data-help]"), black = $("[data-blackout]");
    function notes() { panel.hidden = !notesOn; if (notesOn) panel.innerHTML = "<h4>" + (view.i + 1) + " · " + titleOf(view, view.i) + "</h4>" + notesOf(view, view.i); }
    function site() { location.href = "index.html?pitch=" + (view.i + 1) + (view.slides[view.i].hasAttribute("data-demo") ? "#dashboard" : ""); }
    function presenterWindow() { window.open(location.pathname + "?presenter" + location.hash, "framefly-presenter", "width=1280,height=800"); }
    function fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    }

    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (black.classList.contains("on") && k !== "b" && k !== "B" && k !== ".") { black.classList.remove("on"); e.preventDefault(); return; }
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === "Enter" || (k === " " && !e.shiftKey)) { e.preventDefault(); next(); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace" || (k === " " && e.shiftKey)) { e.preventDefault(); prev(); }
      else if (k === "Home") { e.preventDefault(); go([0, 0]); }
      else if (k === "End") { e.preventDefault(); go([view.slides.length - 1, 0]); }
      else if (k === "f" || k === "F") fullscreen();
      else if (k === "n" || k === "N") { notesOn = !notesOn; notes(); }
      else if (k === "p" || k === "P") presenterWindow();
      else if (k === "s" || k === "S") site();
      else if (k === "b" || k === "B" || k === ".") black.classList.toggle("on");
      else if (k === "?" || k === "h" || k === "H") help.hidden = !help.hidden;
      else if (k === "Escape") { help.hidden = true; notesOn = false; notes(); }
    });

    // a click on the slide moves on, except on a link or a button
    $("[data-viewport]").addEventListener("click", function (e) {
      if (e.target.closest("a, button, [data-help], [data-notes-panel]")) return;
      if (e.clientX < window.innerWidth * 0.2) prev(); else next();
    });
    var tx = null;
    document.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (tx == null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    });

    // the presenter view drives the deck too
    if (channel) channel.onmessage = function (e) {
      var d = e.data || {};
      if (d.type === "next") next();
      else if (d.type === "prev") prev();
      else if (d.type === "goto") go([d.i, d.f || 0]);
      else if (d.type === "hello") broadcast();
      else if (d.type === "black") black.classList.toggle("on");
    };
    window.addEventListener("hashchange", function () {
      var h = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
      if (h && (+h[1] - 1 !== view.i || +(h[2] || 0) !== view.f)) go([+h[1] - 1, +(h[2] || 0)]);
    });

    // the pointer hides itself when it rests, the hint fades
    var idle;
    function wake() { document.body.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(function () { document.body.classList.add("idle"); }, 2500); }
    document.addEventListener("mousemove", wake); wake();
    setTimeout(function () { var h = $("[data-hint]"); if (h) h.classList.add("gone"); }, 4500);
    broadcast();
  }

  // ───────── the presenter view: this slide, the next one, the notes, the clock ─────────
  function presenter() {
    var stage = $("[data-stage]"), vp = $("[data-viewport]");
    $$(".blackout, .notes-panel, .help, .hint").forEach(function (e) { e.remove(); });
    document.title = "Vue présentateur · Framefly";
    var ui = document.createElement("div");
    ui.className = "pv";
    ui.innerHTML =
      '<div class="pv-head"><span class="pv-timer" data-timer>00:00</span><button type="button" data-reset>Remettre à zéro</button><span>Slide <b data-pos></b></span><span data-step></span><span class="sp"></span><span data-clock></span><button type="button" data-black>Écran noir</button><button type="button" data-prev>← Précédent</button><button type="button" data-next>Suivant →</button></div>' +
      '<div class="pv-box pv-cur"><span class="pv-label">À l\'écran</span></div>' +
      '<div class="pv-box pv-next"><span class="pv-label" data-next-label>Ensuite</span></div>' +
      '<div class="pv-notes" data-notes></div>';
    document.body.appendChild(ui);
    $(".pv-cur", ui).appendChild(vp);
    vp.style.inset = "0";
    // the next slide: a copy of the stage without the live dashboard
    var nvp = document.createElement("div");
    nvp.className = "viewport";
    nvp.style.position = "absolute"; nvp.style.inset = "0";
    var nstage = stage.cloneNode(true);
    $$("iframe", nstage).forEach(function (f) { var p = document.createElement("div"); p.className = "pv-placeholder"; p.textContent = "Démo live du dashboard"; f.parentNode.replaceChild(p, f); });
    $$(".demo-wait", nstage).forEach(function (w) { w.remove(); });
    nvp.appendChild(nstage);
    $(".pv-next", ui).appendChild(nvp);
    document.body.classList.add("no-anim");

    // the clock and the timer, which starts on the first move
    var started = 0;
    function start() { started = Date.now(); }

    var cur = new View(stage), nxt = new View(nstage, { noFrames: true });
    function paint(i, f) {
      cur.show(i, f);
      var a = cur.after(i, f), last = a[0] === i && a[1] === f;
      nxt.show(a[0], a[1]);
      $("[data-next-label]").textContent = last ? "Fin du pitch" : a[0] === i ? "Ensuite : même slide, étape " + a[1] : "Ensuite : " + titleOf(cur, a[0]);
      $("[data-pos]").textContent = (i + 1) + " / " + cur.slides.length + " · " + titleOf(cur, i);
      var c = cur.count(i);
      $("[data-step]").textContent = c ? "Étape " + f + " / " + c : "";
      $("[data-notes]").innerHTML = "<h4>Notes</h4>" + notesOf(cur, i);
      if (!started && (i > 0 || f > 0)) start();
    }
    var m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
    paint(m ? +m[1] - 1 : 0, m && m[2] ? +m[2] : 0);

    var send = function (msg) { if (channel) channel.postMessage(msg); };
    function next() { if (channel) send({ type: "next" }); else { var a = cur.after(cur.i, cur.f); paint(a[0], a[1]); } }
    function prev() { if (channel) send({ type: "prev" }); else { var b = cur.before(cur.i, cur.f); paint(b[0], b[1]); } }
    if (channel) channel.onmessage = function (e) { var d = e.data || {}; if (d.type === "state") paint(d.i, d.f); };
    send({ type: "hello" });

    $("[data-next]").onclick = next;
    $("[data-prev]").onclick = prev;
    $("[data-black]").onclick = function () { send({ type: "black" }); };
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter") { e.preventDefault(); next(); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") { e.preventDefault(); prev(); }
      else if (k === "b" || k === "B" || k === ".") send({ type: "black" });
    });

    $("[data-reset]").onclick = function () { started = Date.now(); };
    setInterval(function () {
      var s = started ? Math.floor((Date.now() - started) / 1000) : 0;
      $("[data-timer]").textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60);
      var d = new Date();
      $("[data-clock]").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    }, 500);
  }
})();
