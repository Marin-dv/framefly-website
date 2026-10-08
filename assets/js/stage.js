/*
  The interactive pictures: the canvas on the home page, the caption library and the presenter
  rooms on the templates page. They are small copies of the app's own parts, with the same numbers:
  captions from app/src/components/media/Captions.tsx, the picture from components/plan/Frame.tsx,
  where things come from data/layout.ts.
*/
(function () {
  "use strict";
  var FF = window.FF, D = window.FF_DATA;
  if (!FF || !D) return;
  var $ = FF.$, $$ = FF.$$;
  var byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };

  /* ───────── Captions ───────── */
  var CLS = {
    pop: "cap-pop line heavy stroke upper white", karaoke: "cap-karaoke line heavy stroke white", block: "cap-block heavy upper", oneword: "cap-oneword heavy stroke upper",
    marker: "cap-marker line heavy soft white", punch: "cap-punch line heavy upper white", stack: "cap-stack heavy stroke upper white", outline: "cap-outline line heavy upper",
    neon: "cap-neon line heavy soft white", label: "cap-label", bubble: "cap-bubble", typewriter: "cap-typewriter", subtitle: "cap-subtitle", cinema: "cap-cinema", cc: "cap-cc",
    lower: "cap-lower", clean: "cap-clean line soft white", fade: "cap-fade line soft white", underline: "cap-underline line soft white", glass: "cap-glass",
  };
  var PLAIN = { subtitle: 1, cinema: 1, cc: 1 };
  /** A sentence as a style cuts it: a few words at a time. Returns the group the given word is in. */
  function group(text, word, chunk) {
    var words = text.trim() ? text.trim().split(/\s+/) : [], groups = [[]], chars = 0;
    words.forEach(function (w, i) {
      if ((chunk <= 1 || chars + w.length > chunk) && groups[groups.length - 1].length) { groups.push([]); chars = 0; }
      groups[groups.length - 1].push(i);
      chars += w.length + 1;
    });
    var at = 0;
    for (var g = 0; g < groups.length; g++) if (groups[g].indexOf(word) > -1) at = g;
    return { at: at, words: groups[at].map(function (i) { return { w: words[i], i: i }; }) };
  }
  /** Draws the caption of one moment into a .cap element. `word` is the spoken word, or -1 before the voice starts. */
  function caption(el, id, text, word, accent) {
    var def = byId(D.captions, id);
    if (!def || !text.trim()) { el.innerHTML = ""; el._key = ""; return; }
    if (accent) el.style.setProperty("--cap", accent);
    var g = group(text, word, def.chunk), key = id + "|" + g.at + "|" + text;
    if (el._key !== key) {
      el._key = key;
      var p = document.createElement("p");
      p.className = CLS[id];
      if (PLAIN[id]) p.textContent = g.words.map(function (x) { return x.w; }).join(" ");
      else (id === "oneword" ? g.words.slice(0, 1) : g.words).forEach(function (x) {
        var s = document.createElement("span");
        s.textContent = x.w + (id === "typewriter" ? " " : "");
        s._i = x.i;
        p.appendChild(s);
      });
      el.innerHTML = "";
      el.appendChild(p);
    }
    if (!PLAIN[id]) $$("span", el).forEach(function (s) {
      s.classList.toggle("on", s._i === word);
      s.classList.toggle("said", word >= 0 && s._i < word);
    });
  }
  /** A voice that is not there: walks through the words of a line at the pace of real speech, then starts again. */
  function speaker(count, fn) {
    var word = -1, timer = 0;
    return {
      start: function () { if (!timer && !FF.reduce) timer = setInterval(function () { word = word >= count() + 2 ? -1 : word + 1; fn(Math.min(word, count() - 1)); }, 320); },
      stop: function () { clearInterval(timer); timer = 0; },
    };
  }
  var countOf = function (text) { return text.trim() ? text.trim().split(/\s+/).length : 0; };

  /* ───────── The caption library ───────── */
  $$("[data-capgrid]").forEach(function (grid) {
    var input = $("[data-cap-words]"), demos = $$("[data-cap-demo]", grid);
    var text = function () { return (input && input.value.trim()) || "Your feed, live on your own site"; };
    var paint = function (w) { demos.forEach(function (d) { caption(d, d.getAttribute("data-cap-demo"), text(), w, D.captionAccents[0]); }); };
    var voice = speaker(function () { return countOf(text()); }, paint);
    paint(FF.reduce ? 2 : -1);
    if (input) input.addEventListener("input", function () { paint(FF.reduce ? 2 : 0); });
    FF.onView(grid, function (on) { on ? voice.start() : voice.stop(); }, { threshold: 0.05 });
    $$("[data-family]", grid.parentNode).forEach(function (b) {
      if (b.tagName !== "BUTTON") return;
      b.addEventListener("click", function () {
        FF.choose(b.parentNode, b);
        var f = b.getAttribute("data-family");
        $$(".captile", grid).forEach(function (t) { t.hidden = !!f && t.getAttribute("data-family") !== f; });
      });
    });
  });

  /* ───────── Presenters and rooms ───────── */
  $$("[data-cast]").forEach(function (box) {
    var room = $("[data-cast-room]", box), who = $("[data-cast-who]", box);
    var setRoom = function (id) {
      var s = byId(D.scenes, id);
      room.src = "assets/library/scenes/" + id + ".jpg";
      $("[data-cast-roomname]", box).textContent = s.name;
      $$("[data-cast-scene]", box).forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-cast-scene") === id)); });
    };
    $$("[data-cast-pick]", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = byId(D.presenters, b.getAttribute("data-cast-pick"));
        FF.choose(b.parentNode, b);
        who.src = "assets/library/presenters/" + p.id + ".webp";
        who.alt = p.name + ", a generated presenter";
        $("[data-cast-name]", box).textContent = p.name;
        $("[data-cast-tone]", box).textContent = p.tone;
        setRoom(p.scene); // someone new brings their own room
      });
    });
    $$("[data-cast-scene]", box).forEach(function (b) { b.addEventListener("click", function () { setRoom(b.getAttribute("data-cast-scene")); }); });
  });

  /* ───────── The canvas ───────── */
  $$("[data-stage]").forEach(function (box) {
    var frame = $("[data-frame]", box), L = D.layout;
    var s = { format: "16:9", bg: "dusk", cap: "karaoke", accent: D.captionAccents[0], who: "", mode: "corner", scene: "white-studio", boxes: {} };
    frame.innerHTML =
      '<div class="frame-in"><img class="frame-room" alt="">' +
      '<div class="frame-item frame-app" data-id="app"><div><div class="frame-chrome"><i></i><i></i><i></i></div><img src="assets/app/instagram-feed.webp" alt="Instagram Feed, the app being filmed" width="1400" height="1016"></div></div>' +
      '<div class="frame-item frame-host" data-id="host" hidden><img alt=""></div>' +
      '<div class="frame-item frame-bubble" data-id="presenter" hidden><div><img alt=""></div></div>' +
      '<div class="frame-item frame-cap" data-id="captions"><div class="cap"></div></div>' +
      '<span class="frame-guide v"></span><span class="frame-guide h"></span><span class="frame-ai" hidden>AI presenter</span></div>';
    var inner = $(".frame-in", frame), room = $(".frame-room", frame), cap = $(".cap", frame), ai = $(".frame-ai", frame);
    var items = {};
    $$(".frame-item", frame).forEach(function (el) { items[el.getAttribute("data-id")] = el; });
    var boxOf = function (id) { return (s.boxes[s.format] && s.boxes[s.format][id]) || L.comes[s.format][id]; };
    var word = FF.reduce ? 4 : -1;

    function place(id) {
      var el = items[id], b = boxOf(id);
      el.style.left = b.x * 100 + "%";
      el.style.top = b.y * 100 + "%";
      if (id === "captions") el.style.fontSize = L.typeBase[s.format] * b.w + "cqw";
      else el.style.width = b.w * 100 + "%";
    }
    function render() {
      var bg = byId(D.backgrounds, s.bg), who = byId(D.presenters, s.who), full = !!who && s.mode === "full";
      frame.style.setProperty("--r", String(L.ratio[s.format]));
      inner.style.background = bg.css || 'center / cover url("assets/library/backgrounds/' + bg.img + '.jpg")';
      room.style.opacity = full ? "1" : "0";
      if (who) {
        room.src = "assets/library/scenes/" + s.scene + ".jpg";
        $("img", items.host).src = "assets/library/presenters/" + who.id + ".webp";
        $("img", items.presenter).src = "assets/library/presenters/" + who.id + ".face.jpg";
      }
      items.app.hidden = full;
      items.host.hidden = !full;
      items.presenter.hidden = !who || full;
      ai.hidden = !who;
      Object.keys(items).forEach(place);
      items.captions.hidden = s.cap === "none";
      if (s.cap !== "none") caption(cap, s.cap, D.stageLine, word, s.accent);
      // the panel says what is chosen
      $("[data-bg-name]", box).textContent = bg.name;
      $("[data-cap-name]", box).textContent = s.cap === "none" ? "Off" : byId(D.captions, s.cap).name;
      $("[data-who-name]", box).textContent = who ? who.name + ", " + who.tone.toLowerCase() : "Nobody";
      $("[data-who-options]", box).hidden = !who;
      $("[data-rooms]", box).hidden = !full;
      $("[data-room-name]", box).textContent = byId(D.scenes, s.scene).name;
      $$("[data-room]", box).forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-room") === s.scene)); });
    }

    // the voice walks through the line while the picture is on screen
    var voice = speaker(function () { return countOf(D.stageLine); }, function (w) { word = w; if (s.cap !== "none") caption(cap, s.cap, D.stageLine, word, s.accent); });
    FF.onView(frame, function (on) { on ? voice.start() : voice.stop(); }, { threshold: 0.2 });

    // everything on the picture is dragged; the centre lines hold a thing that comes close
    var drag = null, guides = { v: $(".frame-guide.v", frame), h: $(".frame-guide.h", frame) };
    var pick = function (id) { Object.keys(items).forEach(function (k) { items[k].classList.toggle("picked", k === id); }); };
    Object.keys(items).forEach(function (id) {
      var el = items[id];
      el.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        e.stopPropagation();
        pick(id);
        el.setPointerCapture(e.pointerId);
        drag = { id: id, x: e.clientX, y: e.clientY, box: boxOf(id) };
      });
      el.addEventListener("pointermove", function (e) {
        if (!drag || drag.id !== id) return;
        var r = frame.getBoundingClientRect();
        var x = drag.box.x + (e.clientX - drag.x) / r.width, y = drag.box.y + (e.clientY - drag.y) / r.height;
        if (!e.altKey) { if (Math.abs(x - 0.5) < 0.012) x = 0.5; if (Math.abs(y - 0.5) < 0.018) y = 0.5; }
        x = Math.min(1.15, Math.max(-0.15, x));
        y = Math.min(1.15, Math.max(-0.15, y));
        guides.v.style.display = x === 0.5 ? "block" : "none";
        guides.h.style.display = y === 0.5 ? "block" : "none";
        (s.boxes[s.format] = s.boxes[s.format] || {})[id] = { x: x, y: y, w: drag.box.w };
        place(id);
      });
      ["pointerup", "pointercancel"].forEach(function (ev) { el.addEventListener(ev, function () { drag = null; guides.v.style.display = guides.h.style.display = "none"; }); });
    });
    frame.addEventListener("pointerdown", function () { pick(null); });

    // the panel
    var on = function (sel, fn) { $$(sel, box).forEach(function (b) { b.addEventListener("click", function () { fn(b); render(); }); }); };
    on("[data-format]", function (b) { FF.choose(b.parentNode, b); s.format = b.getAttribute("data-format"); });
    on("[data-bg]", function (b) { FF.choose(b.parentNode, b); s.bg = b.getAttribute("data-bg"); });
    on("[data-cap]", function (b) { FF.choose(b.parentNode, b); s.cap = b.getAttribute("data-cap"); });
    on("[data-accent]", function (b) { FF.choose(b.parentNode, b); s.accent = b.getAttribute("data-accent"); });
    on("[data-who]", function (b) {
      FF.choose(b.parentNode, b);
      s.who = b.getAttribute("data-who");
      var p = byId(D.presenters, s.who);
      if (p) s.scene = p.scene;
    });
    on("[data-mode]", function (b) { FF.choose(b.parentNode, b); s.mode = b.getAttribute("data-mode"); });
    on("[data-room]", function (b) { s.scene = b.getAttribute("data-room"); });
    on("[data-reset]", function () { s.boxes = {}; pick(null); });
    $$("[data-tab]", box).forEach(function (t) {
      t.addEventListener("click", function () {
        FF.choose(t.parentNode, t, "aria-selected");
        $$("[data-pane]", box).forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== t.getAttribute("data-tab"); });
      });
    });
    render();
  });
})();
