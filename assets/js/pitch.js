/* The presentation pages' script: the full-screen dashboard is driven by the scroll, and the small dashboards are scaled to fit. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ── the dashboards shown in a frame: drawn at 1440 x 900, scaled to the width they are given ──
  function fit(box) {
    var f = $("iframe", box), w = box.clientWidth;
    if (f && w) f.style.transform = "scale(" + w / 1440 + ")";
  }
  var boxes = $$(".pf-shot");
  boxes.forEach(function (b) {
    fit(b);
    if ("ResizeObserver" in window) new ResizeObserver(function () { fit(b); }).observe(b);
  });
  window.addEventListener("resize", function () { boxes.forEach(fit); });

  // ── the theme follows the page into every dashboard ──
  var frames = $$("iframe");
  function theme() {
    var v = document.documentElement.getAttribute("data-theme");
    frames.forEach(function (f) { try { f.contentWindow.postMessage({ type: "theme", value: v }, "*"); } catch (e) {} });
  }
  new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── the tour: the scroll position inside the tall section is the step ──
  var tour = $("[data-tour]");
  if (!tour) return;
  var frame = $(".tour-frame", tour), cap = $("[data-tour-cap]", tour), dots = $$(".tour-dots i", tour);
  var CAPS = [
    "Tu envoies ta vidéo. C'est la seule chose qu'on te demande.",
    "L'IA en tire dix variantes : accroche, texte, voix, fond, cadrage.",
    "Chaque variante reçoit un petit budget de test sur Meta Ads : 30 € ici.",
    "On mesure : rétention à 3 secondes, clics, coût par installation. On voit qui gagne.",
    "Le budget quitte les perdantes et va aux gagnantes. Tu valides, ou tu laisses faire.",
    "Les gagnantes servent de base à une nouvelle série. La boucle continue."
  ];
  var cur = -1, ready = false;
  function send() { if (frame && frame.contentWindow && cur >= 0) frame.contentWindow.postMessage({ type: "step", step: cur }, "*"); }
  function show(i) {
    cap.innerHTML = "<b>" + (i + 1) + " / 6</b>" + CAPS[i];
    dots.forEach(function (d, k) { d.className = k < i ? "past" : k === i ? "on" : ""; });
  }
  function update() {
    var r = tour.getBoundingClientRect(), vh = window.innerHeight, total = r.height - vh;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    var i = Math.min(5, Math.floor(p * 6));
    document.body.classList.toggle("tour-on", r.top <= 2 && r.bottom > vh - 2);
    if (i !== cur) { cur = i; show(i); send(); }
  }
  window.addEventListener("message", function (e) { if (e.data && e.data.type === "dashboard-ready" && e.source === frame.contentWindow) { ready = true; send(); theme(); } });
  if (frame) frame.addEventListener("load", function () { send(); theme(); });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
