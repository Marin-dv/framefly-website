/* The home page trailer. One GSAP timeline drives motion; text, typing, classes and captions are pure functions of
   the playhead, so seeking, looping and scrubbing always land on the right frame (deterministic, like a render). */
(function () {
  "use strict";
  var FF = window.FF || {};
  var stage = document.querySelector("[data-stage]");
  var comp = stage && stage.querySelector(".comp");
  if (!stage || !comp) return;

  // Scale the 1280x720 composition to the stage.
  function fit() { comp.style.setProperty("--k", String(stage.clientWidth / 1280)); }
  fit();
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener("resize", fit);

  var player = document.querySelector("[data-player]");
  if (!window.gsap) { if (player) player.hidden = true; return; }
  var gsap = window.gsap;
  var q = function (k, r) { return (r || comp).querySelector('[data-t="' + k + '"]'); };
  var qa = function (k, r) { return Array.prototype.slice.call((r || comp).querySelectorAll('[data-t="' + k + '"]')); };
  var sc = [1, 2, 3, 4, 5, 6].map(function (i) { return comp.querySelector(".sc" + i); });
  var DURATION = 35;
  var SECTIONS = [
    { name: "Prompt", t: 0 },
    { name: "Explore", t: 6.5 },
    { name: "Storyboard", t: 12.8 },
    { name: "Shoot", t: 19.2 },
    { name: "Deliver", t: 26.8 },
  ];

  /* Offset of an element inside a positioned root, unaffected by transforms. */
  function box(el, root) {
    var x = 0, y = 0, e = el;
    while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  }

  /* ───── Tracks evaluated every frame ───── */
  var texts = [], typings = [], classes = [], captions = [];
  function textAt(el, t, v) { if (!el) return; texts.push({ el: el, t: t, v: v }); }
  function typeAt(el, t0, t1, str, before, countEl) { typings.push({ el: el, t0: t0, t1: t1, str: str, before: before == null ? "" : before, countEl: countEl }); }
  function classAt(el, t, cls, on) { if (!el) return; classes.push({ el: el, t: t, cls: cls, on: on }); }
  function captionAt(t0, t1, str) { captions.push({ t0: t0, t1: t1, words: str.split(" ") }); }

  var textInit = new Map(), classInit = new Map();
  function prepareTracks() {
    texts.sort(function (a, b) { return a.t - b.t; });
    classes.sort(function (a, b) { return a.t - b.t; });
    texts.forEach(function (e) { if (!textInit.has(e.el)) textInit.set(e.el, e.el.textContent); });
    classes.forEach(function (e) { var k = e.el; if (!classInit.has(k)) classInit.set(k, {}); var m = classInit.get(k); if (!(e.cls in m)) m[e.cls] = k.classList.contains(e.cls); });
  }
  function setText(el, v) { if (el._tv !== v) { el._tv = v; el.textContent = v; } }
  // On phones the composition is too small to read, so captions are mirrored below the stage at full size.
  var capEl, capLine = -1, outCap = document.querySelector("[data-out-cap]");
  function renderTracks(time) {
    var cur = new Map();
    textInit.forEach(function (v, el) { cur.set(el, v); });
    for (var i = 0; i < texts.length; i++) { if (texts[i].t <= time) cur.set(texts[i].el, texts[i].v); else break; }
    cur.forEach(function (v, el) { setText(el, v); });

    typings.forEach(function (ty) {
      var s;
      if (time < ty.t0) s = ty.before;
      else { var p = Math.min(1, (time - ty.t0) / (ty.t1 - ty.t0)); s = ty.str.slice(0, Math.round(p * ty.str.length)); }
      setText(ty.el, s);
      if (ty.countEl) { var n = s.trim() ? s.trim().split(/\s+/).length : 0; setText(ty.countEl, n + " words"); }
    });

    var st = new Map();
    classInit.forEach(function (m, el) { st.set(el, Object.assign({}, m)); });
    for (var j = 0; j < classes.length; j++) { var c = classes[j]; if (c.t <= time) st.get(c.el)[c.cls] = c.on; else break; }
    st.forEach(function (m, el) { Object.keys(m).forEach(function (k) { if (el.classList.contains(k) !== m[k]) el.classList.toggle(k, m[k]); }); });

    // Karaoke captions.
    var li = -1;
    for (var k = 0; k < captions.length; k++) if (time >= captions[k].t0 && time < captions[k].t1) li = k;
    var capEls = outCap ? [capEl, outCap] : [capEl];
    if (li !== capLine) {
      capLine = li;
      var html = li < 0 ? "" : captions[li].words.map(function (w) { return "<span>" + w + "</span> "; }).join("");
      capEls.forEach(function (c) { c.innerHTML = html; });
    }
    if (li >= 0) {
      var L = captions[li];
      var idx = Math.floor(((time - L.t0) / Math.max(0.1, L.t1 - L.t0 - 0.6)) * L.words.length);
      capEls.forEach(function (c) {
        var spans = c.children;
        for (var s2 = 0; s2 < spans.length; s2++) { spans[s2].classList.toggle("on", s2 < idx); spans[s2].classList.toggle("now", s2 === idx); }
      });
    }

    // Camera timecode while recording.
    if (tcEl) {
      var rt = Math.max(0, Math.min(time, 26.8) - 19.2);
      var f = Math.floor(rt * 24);
      setText(tcEl, "00:00:" + String(Math.floor(f / 24)).padStart(2, "0") + ":" + String(f % 24).padStart(2, "0"));
    }
  }

  var tl, tcEl;
  function build() {
    capEl = q("cap");
    tcEl = q("tc");
    tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power3.out" }, onUpdate: sync, onRepeat: function () { capLine = -1; } });

    function cut(a, b, t) {
      tl.to(a, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, t);
      tl.fromTo(b, { autoAlpha: 0, scale: 1.015 }, { autoAlpha: 1, scale: 1, duration: 0.55 }, t + 0.2);
    }
    function pop(el, t, extra) { tl.fromTo(el, Object.assign({ autoAlpha: 0, y: 8, scale: 0.94 }, extra && extra.from), { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, t); }
    function move(cur, pt, t0, dur) { tl.to(cur, { x: pt.x, y: pt.y, duration: dur || 0.65, ease: "power2.inOut" }, t0); }
    function ripple(r, pt, t) {
      tl.set(r, { x: pt.x, y: pt.y }, t);
      tl.fromTo(r, { scale: 0.2, autoAlpha: 0.95 }, { scale: 1.7, autoAlpha: 0, duration: 0.55, ease: "power2.out", immediateRender: false }, t);
    }
    function focusTo(f, b, t, dur) { tl.to(f, { x: b.x - 5, y: b.y - 5, width: b.w + 10, height: b.h + 10, duration: dur || 0.6, ease: "power2.inOut" }, t); }

    /* ── Scene 1: the prompt ── */
    var typed = q("typed");
    var prompt = typed.getAttribute("data-full");
    typeAt(typed, 0.3, 3.6, prompt, "", q("words"));
    qa("chip").forEach(function (chip) {
      var a = chip.getAttribute("data-anchor");
      var at = prompt.indexOf(a) + a.length;
      pop(chip, 0.3 + (at / prompt.length) * 3.3 + 0.15);
    });
    var f916 = q("fmt916");
    classAt(f916, 4.1, "on", true);
    tl.fromTo(f916, { scale: 1 }, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out", immediateRender: false }, 4.1);
    var rec = q("rec");
    tl.to(rec, { scale: 0.97, duration: 0.1 }, 4.7).to(rec, { scale: 1, duration: 0.2 }, 4.82);
    tl.to(rec.querySelector(".dot"), { borderRadius: 3, width: 13, height: 13, duration: 0.3, ease: "back.out(3)" }, 4.75);
    tl.to(q("roll"), { y: -24, duration: 0.35, ease: "back.out(1.6)" }, 4.8);

    /* ── Scene 2: exploring ── */
    cut(sc[0], sc[1], 5.9);
    var cam2 = q("cam2");
    var cur2 = q("cur2"), foc2 = q("focus2"), rip2 = q("rip2");
    var bInv = box(q("nav-invoices"), cam2), bNew = box(q("btn-new"), cam2), bDel = box(q("btn-del"), cam2);
    var bPay = box(q("nav-payments"), cam2), bRem = box(q("nav-reminders"), cam2);
    var P = function (b) { return { x: b.x + b.w * 0.55, y: b.y + b.h * 0.6 }; };
    tl.set(cur2, { x: 430, y: 340 }, 6.1);
    tl.set(foc2, { x: 400, y: 300, width: 60, height: 60, autoAlpha: 0 }, 6.1);
    tl.to(foc2, { autoAlpha: 1, duration: 0.3 }, 6.6);
    var visits = [[bInv, 6.7], [bNew, 7.8], [bDel, 8.9], [bPay, 10.6], [bRem, 11.6]];
    visits.forEach(function (v) { focusTo(foc2, v[0], v[1] - 0.05); move(cur2, P(v[0]), v[1]); if (v[0] !== bDel) ripple(rip2, P(v[0]), v[1] + 0.68); });
    var row = q("row-over"), del = q("btn-del"), block = q("block");
    classAt(row, 8.95, "hover", true); classAt(row, 10.6, "hover", false);
    tl.fromTo(del, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 8.95).to(del, { autoAlpha: 0, duration: 0.2 }, 10.6);
    classAt(foc2, 9.6, "blocked", true); classAt(foc2, 10.55, "blocked", false);
    tl.fromTo(block, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 9.65).to(block, { autoAlpha: 0, y: -10, duration: 0.3 }, 11.0);
    textAt(q("blocked"), 9.75, "1");
    var navInv = q("nav-invoices"), navPay = q("nav-payments"), navRem = q("nav-reminders"), h2 = q("h2");
    classAt(navInv, 11.35, "on", false); classAt(navPay, 11.35, "on", true); textAt(h2, 11.35, "Payments");
    classAt(navPay, 12.35, "on", false); classAt(navRem, 12.35, "on", true); textAt(h2, 12.35, "Reminders");
    var url2 = q("url2");
    textAt(url2, 8.55, "tallyhq.com/app/invoices/new"); textAt(url2, 9.0, "tallyhq.com/app/invoices");
    textAt(url2, 11.35, "tallyhq.com/app/payments"); textAt(url2, 12.35, "tallyhq.com/app/reminders");
    var feats = qa("feat"), count = q("count");
    [[0, 7.55, "9"], [1, 8.65, "13"], [2, 11.5, "18"], [3, 12.45, "22"]].forEach(function (f) { pop(feats[f[0]], f[1], { from: { x: 12, y: 0 } }); textAt(count, f[1], f[2]); });

    /* ── Scene 3: the storyboard ── */
    cut(sc[1], sc[2], 12.6);
    qa("panel").forEach(function (p, i) { tl.fromTo(p, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 12.9 + i * 0.1); });
    tl.fromTo(q("approve"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 13.4);
    var vo2 = q("vo2"), vo2t = q("vo2t");
    classAt(vo2, 14.3, "edit", true); classAt(vo2t, 14.55, "sel", true); classAt(vo2t, 14.95, "sel", false); classAt(vo2, 16.3, "edit", false);
    typeAt(vo2t, 14.95, 15.95, vo2t.getAttribute("data-new"), vo2t.textContent);
    textAt(q("dur2"), 16.0, "0:09"); textAt(q("sbtotal"), 16.0, "0:37"); textAt(q("barlen"), 16.0, "0:37");
    var go = q("go"), cur3 = q("cur3");
    var bGo = box(go, sc[2]);
    tl.fromTo(cur3, { autoAlpha: 0, x: 760, y: 470 }, { autoAlpha: 1, duration: 0.25 }, 16.2);
    move(cur3, { x: bGo.x + bGo.w * 0.45, y: bGo.y + bGo.h * 0.55 }, 16.3, 0.7);
    tl.to(go, { scale: 0.96, duration: 0.08 }, 17.05).to(go, { scale: 1, duration: 0.25, ease: "back.out(3)" }, 17.14);
    textAt(q("go-l"), 17.15, "Approved"); classAt(q("bar-a"), 17.2, "gone", true); classAt(q("bar-b"), 17.2, "gone", false);

    /* ── Scene 4: the take ── */
    cut(sc[2], sc[3], 18.9);
    var cam4 = q("cam4"), cur4 = q("cur4"), rip4 = q("rip4"), nl = q("newline");
    gsap.set(nl, { height: 0 });
    var bAdd = box(q("addline"), cam4);
    gsap.set(nl, { height: 48 });
    var bLines = box(q("lines"), cam4), bSend = box(q("send"), cam4);
    gsap.set(nl, { height: 0 });
    tl.set(cur4, { x: 560, y: 470 }, 19.2);
    move(cur4, { x: bAdd.x + 70, y: bAdd.cy }, 19.9, 0.7);
    ripple(rip4, { x: bAdd.x + 70, y: bAdd.cy }, 20.62);
    // Frame the line items: scale around their center and pan that center to the middle of the screen.
    var scr = cam4.parentNode, cx = scr.offsetWidth / 2, cy = scr.offsetHeight / 2, ly = bLines.cy + 24;
    tl.to(cam4, { scale: 1.3, x: cx - bLines.cx, y: cy - ly, transformOrigin: bLines.cx + "px " + ly + "px", duration: 0.9, ease: "back.out(1.25)" }, 20.8);
    tl.fromTo(nl, { height: 0, autoAlpha: 0 }, { height: 48, autoAlpha: 1, duration: 0.35, ease: "power2.out" }, 20.85);
    var nlDesc = q("nl-desc"), nlAmt = q("nl-amt");
    typeAt(nlDesc, 21.2, 22.05, "Landing page", ""); classAt(nlDesc, 21.2, "typing", true); classAt(nlDesc, 22.1, "typing", false);
    textAt(q("nl-qty"), 22.15, "1");
    typeAt(nlAmt, 22.3, 22.8, "$1,800.00", ""); classAt(nlAmt, 22.3, "typing", true); classAt(nlAmt, 22.85, "typing", false);
    var tot = q("inv-total");
    textAt(tot, 22.95, "$4,200.00");
    tl.fromTo(tot, { scale: 1 }, { scale: 1.08, duration: 0.14, yoyo: true, repeat: 1, transformOrigin: "0% 50%", immediateRender: false }, 22.95);
    tl.to(cam4, { scale: 1, x: 0, y: 0, duration: 0.8, ease: "power3.inOut" }, 23.3);
    move(cur4, { x: bSend.cx, y: bSend.cy }, 23.9, 0.7);
    ripple(rip4, { x: bSend.cx, y: bSend.cy }, 24.62);
    tl.to(q("send"), { scale: 0.95, duration: 0.08 }, 24.6).to(q("send"), { scale: 1, duration: 0.25 }, 24.7);
    tl.to(cam4, { scale: 1.1, transformOrigin: bSend.cx + "px " + bSend.cy + "px", duration: 1.4, ease: "power2.out" }, 24.7);
    tl.fromTo(q("toast"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 24.85);
    var stt = q("inv-status");
    textAt(stt, 24.85, "Sent"); classAt(stt, 24.85, "draft", false); classAt(stt, 24.85, "sent", true);
    var takes = qa("take");
    classAt(takes[1], 24.95, "now", false); classAt(takes[1], 24.95, "done", true); textAt(takes[1].querySelector("small"), 24.95, "98% match");
    classAt(takes[2], 24.95, "now", true); textAt(takes[2].querySelector("small"), 24.95, "REC");

    /* ── Scene 5: delivery ── */
    cut(sc[3], sc[4], 26.6);
    tl.fromTo(q("dlhead"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 26.9);
    qa("frame").forEach(function (f, i) { tl.fromTo(f, { autoAlpha: 0, y: 34, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.2)" }, 27.1 + i * 0.12); });
    qa("exp").forEach(function (e, i) { pop(e, 27.9 + i * 0.07); });

    /* ── Scene 6: end card ── */
    cut(sc[4], sc[5], 31.2);
    tl.fromTo(q("endmark"), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.8)" }, 31.5);
    tl.fromTo(q("endword"), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 }, 31.75);
    tl.fromTo(q("endtag"), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 }, 31.95);
    tl.fromTo(q("enddate"), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 }, 32.15);
    tl.to(sc[5], { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 34.5);
    tl.set({}, {}, DURATION);

    captionAt(0.4, 5.8, "Describe the video you need. One prompt is enough.");
    captionAt(6.8, 12.5, "The agent explores your app. It never pays, deletes or sends.");
    captionAt(13.1, 18.8, "You approve the storyboard. Nothing is filmed before that.");
    captionAt(19.6, 26.5, "Clean takes, a smooth cursor, a zoom on every click.");
    captionAt(27.1, 31.1, "Every format, with captions and a project you can edit.");

    FF.trailer = tl;
    prepareTracks();
    // Static fallback state lives in the HTML; now reset it to frame 0.
    typed.parentNode.querySelector(".tr-caret").hidden = false;
    tl.progress(0);
    renderTracks(0);
    setupPlayer();
  }

  /* ───── Player ───── */
  var scrubBtns = [], timeEl, playBtn, userPaused = false, inView = false;
  function fmt(t) { t = Math.floor(t); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); }
  function sync() {
    var t = tl.time();
    renderTracks(t);
    if (!timeEl) return;
    timeEl.innerHTML = "<b>" + fmt(t) + "</b> / " + fmt(DURATION);
    SECTIONS.forEach(function (s, i) {
      var end = i < SECTIONS.length - 1 ? SECTIONS[i + 1].t : DURATION;
      var p = Math.max(0, Math.min(1, (t - s.t) / (end - s.t)));
      scrubBtns[i].style.setProperty("--p", (p * 100).toFixed(2) + "%");
      var on = t >= s.t && t < end;
      if ((scrubBtns[i].getAttribute("aria-current") === "true") !== on) scrubBtns[i].setAttribute("aria-current", String(on));
    });
  }
  function setPlaying(on) {
    if (!playBtn) return;
    playBtn.innerHTML = FF.icon(on ? "pause" : "play");
    playBtn.setAttribute("aria-label", on ? "Pause the trailer" : "Play the trailer");
  }
  function play() { tl.play(); setPlaying(true); }
  function pause() { tl.pause(); setPlaying(false); }
  function setupPlayer() {
    if (!player) return;
    var scrub = player.querySelector(".scrub");
    timeEl = player.querySelector(".player-time");
    playBtn = player.querySelector("[data-play]");
    SECTIONS.forEach(function (s, i) {
      var end = i < SECTIONS.length - 1 ? SECTIONS[i + 1].t : DURATION;
      var b = document.createElement("button");
      b.type = "button";
      b.style.setProperty("--w", String(end - s.t));
      b.setAttribute("aria-label", "Jump to " + s.name);
      b.innerHTML = '<span class="bar"><span></span></span><span class="nm">' + s.name + "</span>";
      b.addEventListener("click", function () { tl.time(s.t + 0.01); if (!FF.reduce) { userPaused = false; play(); } else sync(); });
      scrub.appendChild(b);
      scrubBtns.push(b);
    });
    playBtn.addEventListener("click", function () {
      if (tl.isActive()) { userPaused = true; pause(); } else { userPaused = false; play(); }
    });
    if (FF.reduce) {
      // No autoplay: rest on the storyboard, the most telling frame.
      tl.time(15.2); pause(); sync();
      return;
    }
    FF.onView(stage, function (v) { inView = v; if (v && !userPaused) play(); else if (!v) { tl.pause(); setPlaying(false); } }, { threshold: 0.35 });
    document.addEventListener("visibilitychange", function () { if (document.hidden) tl.pause(); else if (inView && !userPaused) play(); });
    sync();
  }

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { requestAnimationFrame(build); });
})();
