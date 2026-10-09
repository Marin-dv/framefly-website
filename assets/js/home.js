/* The home page's own motion: the desktop of files, the statement lit word by word, the two frame rates, the cost calculator, the template films. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = !window.matchMedia("(pointer: coarse)").matches;
  var framed = window.innerHeight < 2400; // the page scrolls inside its own window; if not, nothing is tied to the scroll
  var usd = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var inView = function (el, fn, opts) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, opts || { threshold: 0.2 }).observe(el);
  };

  /* the template films play while they are on screen */
  $$("[data-rx-films] video").forEach(function (v) {
    inView(v, function (on) { if (on && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }, { threshold: 0.35 });
  });

  /* the desktop: files to push around, then one button that clears it */
  (function () {
    var desk = $("#desk"); if (!desk) return;
    var area = $("#desk-area"), files = $$(".dk-file", area), go = $("#desk-go"), back = $("#desk-back"), count = $("#desk-count"), done = $("#desk-done"), vid = $("video", done), z = 16;
    files.forEach(function (f, i) {
      f.style.setProperty("--i", i);
      if (!fine) return;
      var sx = 0, sy = 0, ox = 0, oy = 0, held = false;
      f.addEventListener("pointerdown", function (e) {
        if (desk.getAttribute("data-state") !== "mess") return;
        held = true; sx = e.clientX; sy = e.clientY;
        ox = parseFloat(f.style.getPropertyValue("--dx")) || 0; oy = parseFloat(f.style.getPropertyValue("--dy")) || 0;
        z = Math.min(z + 1, 28); f.style.zIndex = z; f.classList.add("held");
        try { f.setPointerCapture(e.pointerId); } catch (x) {}
        e.preventDefault();
      });
      f.addEventListener("pointermove", function (e) {
        if (!held) return;
        f.style.setProperty("--dx", (ox + e.clientX - sx) + "px"); f.style.setProperty("--dy", (oy + e.clientY - sy) + "px");
      });
      var drop = function () { held = false; f.classList.remove("held"); };
      f.addEventListener("pointerup", drop); f.addEventListener("pointercancel", drop);
    });
    var steps = $$(".dk-step", done), bar = $(".dk-bar b", done), tally = $("[data-dk-count]", done), timers = [];
    $$(".dk-out span", done).forEach(function (c, n) { c.style.setProperty("--n", n); });
    function work(on) {
      timers.forEach(clearTimeout); timers = [];
      done.removeAttribute("data-phase");
      steps.forEach(function (s) { s.className = "dk-step"; });
      bar.style.width = "0"; tally.textContent = "0 / " + steps.length;
      if (!on) { vid.pause(); return; }
      var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); }, fin = function () { steps.forEach(function (s) { s.className = "dk-step ok"; }); bar.style.width = "100%"; tally.textContent = steps.length + " / " + steps.length; done.setAttribute("data-phase", "delivered"); if (!reduce) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } };
      if (reduce) { fin(); return; }
      steps.forEach(function (s, i) {
        at(800 + i * 850, function () {
          if (i) steps[i - 1].className = "dk-step ok";
          s.className = "dk-step on"; tally.textContent = i + " / " + steps.length; bar.style.width = ((i + 0.5) / steps.length) * 100 + "%";
        });
      });
      at(800 + steps.length * 850, fin);
    }
    function set(clean) {
      var a = area.getBoundingClientRect();
      files.forEach(function (f) {
        if (!clean) { f.style.setProperty("--dx", "0px"); f.style.setProperty("--dy", "0px"); return; }
        var r = f.getBoundingClientRect(), dx = parseFloat(f.style.getPropertyValue("--dx")) || 0, dy = parseFloat(f.style.getPropertyValue("--dy")) || 0;
        f.style.setProperty("--dx", (dx + a.left + a.width / 2 - (r.left + r.width / 2)).toFixed(1) + "px");
        f.style.setProperty("--dy", (dy + a.top + a.height / 2 - (r.top + r.height / 2)).toFixed(1) + "px");
      });
      desk.setAttribute("data-state", clean ? "clean" : "mess");
      go.hidden = clean; back.hidden = !clean;
      done.setAttribute("aria-hidden", String(!clean));
      count.textContent = clean ? "1 brief · 1 film" : "11 files · 14 takes · 1 sticky note";
      work(clean);
    }
    go.addEventListener("click", function () { set(true); });
    back.addEventListener("click", function () { set(false); });
    if (framed && !reduce && "IntersectionObserver" in window && area.getBoundingClientRect().top > window.innerHeight * 0.8) {
      desk.classList.add("pre");
      var seen = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { desk.classList.remove("pre"); desk.classList.add("in"); seen.disconnect(); } }, { threshold: 0.3 });
      seen.observe(area);
      setTimeout(function () { desk.classList.remove("pre"); }, 6000);
    }
  })();

  /* statement: split into words, lit as it passes */
  var st = $("#statement"), wds = [];
  if (st) {
    var marked = { "brief.": 1, "films": 1, "plan": 1 };
    st.innerHTML = st.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd' + (marked[w] ? " rx-hl" : "") + '">' + w + "</span>"; }).join(" ");
    wds = $$(".wd", st);
    if (framed && !reduce) st.classList.add("live");
  }
  function onScroll() {
    if (!st || !st.classList.contains("live")) return;
    var vh = window.innerHeight, r = st.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh * 0.55 - r.top) / (r.height + vh * 0.15))), n = Math.ceil(p * wds.length);
    wds.forEach(function (w, i) { w.classList.toggle("on", i < n); });
  }
  var ticking = false;
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* capture lanes: one drawn every frame, one at 20 fps with a freeze */
  (function () {
    var bad = $("#lane-bad"), good = $("#lane-good"), state = $("#lane-state"), box = $("#lanes"), on = false, raf = 0;
    if (!bad || !good) return;
    var pos = function (t) { var c = (t % 3600) / 3600, p = c < 0.5 ? c * 2 : 2 - c * 2; return p * p * (3 - 2 * p); }; // there and back, eased
    function draw(now) {
      var w = bad.parentNode.clientWidth - 26;
      good.style.transform = "translateX(" + (pos(now) * w).toFixed(1) + "px)";
      var cycle = now % 5200, frozen = cycle > 1500 && cycle < 2433;
      var t = frozen ? now - (cycle - 1500) : Math.floor(now / 50) * 50;
      bad.style.transform = "translateX(" + (pos(t) * w).toFixed(1) + "px)";
      state.textContent = frozen ? "frozen" : "";
      if (on) raf = requestAnimationFrame(draw);
    }
    if (reduce) { draw(900); return; }
    inView(box, function (v) { on = v; cancelAnimationFrame(raf); if (v) raf = requestAnimationFrame(draw); }, { threshold: 0.1 });
  })();

  /* calculator */
  (function () {
    var hours = $("#c-hours"), rate = $("#c-rate"), videos = $("#c-videos");
    if (!hours) return;
    function cheapest(n) { // least money for at least n credits
      var best = Infinity;
      for (var a = 0; a <= Math.ceil(n / 15); a++) for (var b = 0; b <= Math.ceil(n / 5); b++) {
        var left = Math.max(0, n - a * 15 - b * 5), cost = a * 249 + b * 99 + left * 29;
        if (cost < best) best = cost;
      }
      return best;
    }
    function tween(el, to, fmt) {
      var from = el._v == null ? to : el._v; el._v = to;
      cancelAnimationFrame(el._raf);
      if (from === to || reduce) { el.textContent = fmt(to); return; }
      var t0 = performance.now();
      (function step(t) { var p = Math.min(1, (t - t0) / 420), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) el._raf = requestAnimationFrame(step); })(t0);
    }
    function update() {
      var h = +hours.value, r = +rate.value, v = +videos.value;
      var handH = h * v, hand = handH * r, ffH = v * 0.5, ff = cheapest(v) + ffH * r;
      $("#o-hours").textContent = h + " h"; $("#o-rate").textContent = usd(r); $("#o-videos").textContent = v;
      tween($("#o-hand"), hand, usd); tween($("#o-ff"), ff, usd);
      $("#o-hand-h").textContent = handH + " hours a year";
      $("#o-ff-h").textContent = usd(cheapest(v)) + " of credits, " + (ffH % 1 ? ffH.toFixed(1) : ffH) + " hours of yours";
      var back = hand - ff, backH = handH - ffH;
      tween($("#o-back"), Math.max(0, back), usd);
      $("#o-back-h").textContent = back > 0 ? "That is " + (backH % 1 ? backH.toFixed(1) : backH) + " hours of your time, for " + usd(cheapest(v)) + " of credits." : "At these numbers a video by hand costs you less. Framefly still gives you the hours.";
    }
    [hours, rate, videos].forEach(function (i) { i.addEventListener("input", update); });
    update();
  })();
})();
