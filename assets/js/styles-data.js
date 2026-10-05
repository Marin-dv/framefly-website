/* The twelve Framefly styles (same specs as the app's src/data/templates.ts) and a small poster renderer
   that plays each style's real transition, pacing and camera. */
(function () {
  "use strict";
  var FF = (window.FF = window.FF || {});

  FF.styles = [
    { id: "launchpad", name: "Launchpad", category: "Launch", description: "Fast cuts, spring zooms on every click, big caption blocks. Built for launch day on X and Product Hunt.", duration: 60, pacing: "Brisk", palette: ["#0c0d0a", "#1a1c14", "#d3f261", "#f4f6ec"], type: "sans", transition: "Whip", camera: "Spring zoom", captions: "Bold block", music: "Driving electronic, 124 BPM", formats: ["16:9", "9:16", "1:1"], badge: "Popular" },
    { id: "keynote", name: "Mono Keynote", category: "Explainer", description: "Slow dolly moves across a monochrome stage. Lets the product breathe, like a keynote segment.", duration: 90, pacing: "Relaxed", palette: ["#f5f5f4", "#e7e7e5", "#111111", "#111111"], type: "wide", transition: "Fade", camera: "Dolly", captions: "Minimal", music: "Soft piano and pads", formats: ["16:9", "1:1"] },
    { id: "soft-studio", name: "Soft Studio", category: "Feature", description: "Pastel backdrops, a rounded device frame, a camera that follows the cursor. Friendly feature spotlights.", duration: 45, pacing: "Standard", palette: ["#f3eefe", "#ffffff", "#7b61ff", "#1e1b2e"], type: "sans", transition: "Morph", camera: "Follow cursor", captions: "Karaoke", music: "Light acoustic pop", formats: ["16:9", "9:16", "4:5"] },
    { id: "changelog", name: "Changelog Cut", category: "Changelog", description: "One beat per shipped change, numbered cards between shots. Made for monthly update posts.", duration: 45, pacing: "Brisk", palette: ["#101418", "#1b2229", "#4cc2ff", "#e9f2f8"], type: "mono", transition: "Cut", camera: "Static", captions: "Minimal", music: "Minimal tech house", formats: ["16:9", "1:1"], badge: "New" },
    { id: "vertical-hook", name: "Vertical Hook", category: "Social", description: "A 2-second hook, then three rapid wins. Vertical first, captions always on, for TikTok and Reels.", duration: 20, pacing: "Brisk", palette: ["#140b0b", "#261414", "#ff5a3c", "#fff4ef"], type: "sans", transition: "Whip", camera: "Spring zoom", captions: "Bold block", music: "Punchy trap beat", formats: ["9:16"], badge: "Popular" },
    { id: "onboarding", name: "Onboarding Guide", category: "Onboarding", description: "A calm step-by-step walkthrough with a presenter in the corner. For help centers and first-run emails.", duration: 120, pacing: "Relaxed", palette: ["#0f1a17", "#172722", "#5fe0a8", "#e8f5ef"], type: "sans", transition: "Slide", camera: "Follow cursor", captions: "Karaoke", music: "Warm lo-fi", formats: ["16:9"], presenter: true },
    { id: "terminal-noir", name: "Terminal Noir", category: "Launch", description: "Green-on-black type, scanline cuts, mono captions. Dev tools and CLIs look at home here.", duration: 45, pacing: "Standard", palette: ["#050806", "#0d140f", "#39ff88", "#c8f5d6"], type: "mono", transition: "Cut", camera: "Spring zoom", captions: "Minimal", music: "Dark synth pulse", formats: ["16:9", "1:1"], badge: "Pro" },
    { id: "newsprint", name: "Newsprint", category: "Explainer", description: "Editorial title cards in a serif face, red underlines, slow fades. Reads like a feature article.", duration: 75, pacing: "Relaxed", palette: ["#f6f4ef", "#ffffff", "#d7263d", "#161616"], type: "serif", transition: "Fade", camera: "Dolly", captions: "Minimal", music: "Cinematic strings", formats: ["16:9", "4:5"] },
    { id: "night-drive", name: "Night Drive", category: "Feature", description: "Deep navy with electric highlights and slide transitions. High-energy feature reveals.", duration: 40, pacing: "Brisk", palette: ["#070b1f", "#10173a", "#3d7bff", "#e6ecff"], type: "wide", transition: "Slide", camera: "Spring zoom", captions: "Bold block", music: "Synthwave, 110 BPM", formats: ["16:9", "9:16"] },
    { id: "store", name: "Store Listing", category: "Store", description: "Tuned for the Chrome Web Store and the Framer Marketplace: 30 s, a 1280x800 safe area, no text near the edges.", duration: 30, pacing: "Standard", palette: ["#ffffff", "#f2f4f7", "#1a73e8", "#1f2328"], type: "sans", transition: "Zoom", camera: "Follow cursor", captions: "Minimal", music: "Bright corporate", formats: ["16:9"], badge: "New" },
    { id: "founder", name: "Founder Story", category: "Launch", description: "A presenter opens and closes on camera, the product in the middle. Personal, direct, trustworthy.", duration: 90, pacing: "Standard", palette: ["#16120e", "#221c16", "#ffb547", "#fbf3e6"], type: "sans", transition: "Morph", camera: "Dolly", captions: "Karaoke", music: "Hopeful indie guitar", formats: ["16:9", "9:16"], badge: "Pro", presenter: true },
    { id: "readme-loop", name: "README Loop", category: "Social", description: "An 8-second silent loop that restarts cleanly. Exports a GIF and a WebM for GitHub READMEs.", duration: 8, pacing: "Standard", palette: ["#0d1117", "#161b22", "#f0883e", "#e6edf3"], type: "mono", transition: "Cut", camera: "Follow cursor", captions: "None", music: "None", formats: ["16:9", "1:1"] },
  ];
  FF.styleById = function (id) { return FF.styles.filter(function (s) { return s.id === id; })[0] || FF.styles[0]; };

  FF.typeCss = function (type) {
    if (type === "mono") return "font-family:var(--mono);letter-spacing:-0.02em;font-weight:600";
    if (type === "serif") return "font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;font-weight:500";
    if (type === "wide") return "font-family:var(--sans);letter-spacing:0.04em;font-weight:700;text-transform:uppercase";
    return "font-family:var(--sans);letter-spacing:-0.035em;font-weight:700";
  };
  FF.typeName = function (type) { return type === "mono" ? "Mono" : type === "serif" ? "Editorial serif" : type === "wide" ? "Wide display" : "Grotesk"; };

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* A look = the resolved facets a poster needs. A plain style is its own look; the mixer builds mixed ones. */
  FF.lookOf = function (t) { return { name: t.name, palette: t.palette, type: t.type, captions: t.captions, transition: t.transition, camera: t.camera, pacing: t.pacing }; };

  function winArt() {
    return '<div class="win"><div class="bar"><i></i><i></i><i></i></div><div class="body"><div class="side"><i style="width:70%"></i><i style="width:52%"></i><i style="width:60%"></i><i style="width:44%"></i></div>' +
      '<div class="main"><span class="t"></span><div class="cards"><i></i><i></i><i></i></div><span class="ln" style="width:82%"></span><span class="ln" style="width:64%"></span><span class="ln" style="width:72%"></span></div></div></div>';
  }

  FF.posterHTML = function (look, appName) {
    var p = look.palette, bg = p[0], surf = p[1], acc = p[2], txt = p[3];
    var tcss = FF.typeCss(look.type);
    var zoomy = look.camera === "Spring zoom" || look.camera === "Dolly";
    var capBold = look.captions === "Bold block";
    var capText = look.captions === "None" ? "Loops cleanly" : "Captions stay in sync";
    var capStyle = look.captions === "None" ? "" : capBold ? "background:" + acc + ";color:" + bg : "background:" + bg + "cc;color:" + txt;
    return (
      '<div class="shot-l on" data-i="0"><div class="pc"><span class="app"><i></i>' + esc(appName || "Your app") + '</span><span class="h" style="' + tcss + '">' + esc(look.name) + '</span><span class="u"></span></div></div>' +
      '<div class="shot-l" data-i="1"><div class="zoomer">' + winArt() + (zoomy ? "" : '<div class="wc"><span class="h" style="' + tcss + '">Show the win first</span></div>') + "</div></div>" +
      '<div class="shot-l" data-i="2"><div class="cap"><span style="' + tcss + ";" + capStyle + '">' + capText + "</span></div></div>" +
      (look.camera !== "Static" ? '<svg class="pcur" aria-hidden="true"><use href="assets/img/icons.svg#i-cursor"></use></svg>' : "")
    );
  };

  FF.paintPoster = function (el, look, appName) {
    var p = look.palette;
    el.style.setProperty("--pb", p[0]);
    el.style.setProperty("--ps", p[1]);
    el.style.setProperty("--pa", p[2]);
    el.style.setProperty("--pt", p[3]);
    el.style.background = "radial-gradient(120% 90% at 85% 0%, " + p[2] + "26 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, " + p[1] + " 0%, " + p[0] + " 70%)";
    el.style.color = p[3];
    el.innerHTML = FF.posterHTML(look, appName);
    el._look = look;
    el.setAttribute("data-shot", "0");
  };

  var ENTER = {
    Cut: null,
    Fade: { k: [{ opacity: 0 }, { opacity: 1 }], d: 600 },
    Slide: { k: [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], d: 500 },
    Whip: { k: [{ transform: "translateX(100%)", filter: "blur(8px)" }, { transform: "translateX(0)", filter: "blur(0)" }], d: 280 },
    Zoom: { k: [{ transform: "scale(1.35)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], d: 450 },
    Morph: { k: [{ transform: "scale(0.9)", opacity: 0, borderRadius: "40px" }, { transform: "scale(1)", opacity: 1, borderRadius: "0px" }], d: 500 },
  };

  FF.showShot = function (el, i) {
    var look = el._look;
    if (!look) return;
    var layers = el.querySelectorAll(".shot-l");
    layers.forEach(function (l) { l.classList.toggle("on", +l.getAttribute("data-i") === i); });
    el.setAttribute("data-shot", String(i));
    var enter = ENTER[look.transition];
    if (enter && !FF.reduce && layers[i].animate) layers[i].animate(enter.k, { duration: enter.d, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    var z = el.querySelector(".zoomer");
    if (z) {
      if (i === 1 && !FF.reduce && (look.camera === "Spring zoom" || look.camera === "Dolly")) {
        z.style.transition = look.camera === "Spring zoom" ? "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 250ms" : "transform 2s linear";
        z.style.transform = "scale(" + (look.camera === "Spring zoom" ? 1.3 : 1.1) + ")";
      } else { z.style.transition = "none"; z.style.transform = "scale(1)"; }
    }
  };

  /* Plays a poster through its three shots at the style's pacing while `on` is true. */
  FF.previewer = function (el) {
    var timer = null, shot = 0;
    function step() { shot = (shot + 1) % 3; FF.showShot(el, shot); }
    return {
      play: function () {
        if (timer || FF.reduce || !el._look) return;
        var ms = el._look.pacing === "Brisk" ? 1100 : el._look.pacing === "Standard" ? 1500 : 2000;
        timer = setInterval(step, ms);
      },
      stop: function () { clearInterval(timer); timer = null; shot = 0; FF.showShot(el, 0); },
      restart: function () { this.stop(); this.play(); },
    };
  };

  FF.styleCard = function (t, opts) {
    opts = opts || {};
    var badge = t.badge ? '<span class="badge ' + (t.badge === "Pro" ? "" : "badge-accent") + '">' + t.badge + "</span>" : "";
    var html =
      '<article class="style-card" data-cat="' + t.category + '" data-formats="' + t.formats.join(" ") + '" tabindex="0" aria-label="' + esc(t.name) + ' style">' +
      '<div class="poster" aria-hidden="true"></div>' +
      '<div class="style-body"><h3>' + esc(t.name) + badge + "</h3><p>" + esc(t.description) + "</p>" +
      (opts.spec
        ? '<div class="spec"><div><span>Pacing</span><b>' + t.pacing + "</b></div><div><span>Transitions</span><b>" + t.transition + "</b></div><div><span>Camera</span><b>" + t.camera + "</b></div><div><span>Captions</span><b>" + t.captions + "</b></div><div><span>Type</span><b>" + FF.typeName(t.type) + "</b></div><div><span>Music</span><b>" + esc(t.music) + "</b></div></div>"
        : "") +
      '<div class="style-meta">' + t.formats.map(function (f) { return '<span class="badge badge-mono">' + f + "</span>"; }).join("") + '<span class="badge badge-mono">' + (t.duration >= 60 ? Math.floor(t.duration / 60) + ":" + String(t.duration % 60).padStart(2, "0") : "0:" + String(t.duration).padStart(2, "0")) + "</span>" + (t.presenter ? '<span class="badge">Presenter</span>' : "") + "</div></div></article>";
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    var card = wrap.firstChild;
    var poster = card.querySelector(".poster");
    FF.paintPoster(poster, FF.lookOf(t), opts.appName);
    var pv = FF.previewer(poster);
    card.addEventListener("mouseenter", function () { pv.play(); });
    card.addEventListener("focus", function () { pv.play(); });
    card.addEventListener("mouseleave", function () { if (!card._inView) pv.stop(); });
    card.addEventListener("blur", function () { if (!card._inView) pv.stop(); });
    // On touch screens there is no hover, so cards play while they are fully on screen.
    if (window.matchMedia("(hover: none)").matches && FF.onView) {
      FF.onView(card, function (v) { card._inView = v; v ? pv.play() : pv.stop(); }, { threshold: 0.7 });
    }
    return card;
  };
})();
