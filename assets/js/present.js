/*
  Pitch mode. The deck (pitch.html) opens the site with ?pitch=N. Until you leave it, every page shows a way back
  to slide N, and Escape takes you there. On the home page a presenter remote (PageDown, PageUp, arrows, space)
  moves from one part of the page to the next, through the six steps of the dashboard, so the same remote drives
  the slides and the site. Visitors who did not come from the deck see none of this.
*/
(function () {
  "use strict";
  var KEY = "framefly.pitch";
  var q = new URLSearchParams(location.search), n = q.get("pitch");
  try { if (n) sessionStorage.setItem(KEY, n); else n = sessionStorage.getItem(KEY); } catch (e) {}
  if (!n || !/^\d+$/.test(n) || window.parent !== window) return;

  var $ = function (s) { return document.querySelector(s); };
  var icon = window.FF && window.FF.icon ? window.FF.icon : function () { return ""; };
  var root = document.documentElement.getAttribute("data-root") || "";
  var back = root + "pitch.html#" + n;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.classList.add("pitch-mode");
  var pill = document.createElement("div");
  pill.className = "pitch-back";
  pill.innerHTML = '<a href="' + back + '">' + icon("arrow-left") + "Retour au pitch<kbd>Échap</kbd></a>" +
    '<button type="button" aria-label="Quitter le mode pitch" title="Quitter le mode pitch">' + icon("x") + "</button>";
  document.body.appendChild(pill);
  pill.querySelector("button").addEventListener("click", function () {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    document.body.classList.remove("pitch-mode");
    pill.remove();
  });
  var hint = $(".tour-hint");
  if (hint) hint.textContent = "→ ou télécommande pour avancer";

  // ── the stops of the home page: each section, then each step of the dashboard tour ──
  var home = !!$("[data-tour]");
  function top(el) { return Math.round(el.getBoundingClientRect().top + window.scrollY); }
  function stops() {
    var s = [0], vh = window.innerHeight, add = function (sel) { var el = $(sel); if (el) s.push(top(el)); };
    ["#probleme", "#variantes", "#dashboard"].forEach(add);
    var tour = $("[data-tour]");
    if (tour) { var t = top(tour), span = tour.offsetHeight - vh; for (var i = 0; i < 6; i++) s.push(Math.round(t + (span * (i + 0.5)) / 6)); }
    ["#controle", "#entretiens", "#tarifs", ".closing-band"].forEach(add);
    var max = document.documentElement.scrollHeight - vh;
    return s.map(function (v) { return Math.min(v, max); }).sort(function (a, b) { return a - b; }).filter(function (v, k, a) { return !k || v - a[k - 1] > 4; });
  }
  var aim = null, aimAt = 0;
  function move(dir) {
    var s = stops(), from = aim != null && Date.now() - aimAt < 900 ? aim : window.scrollY, to = null;
    if (dir > 0) { for (var k = 0; k < s.length; k++) if (s[k] > from + 8) { to = s[k]; break; } }
    else { for (var j = s.length - 1; j >= 0; j--) if (s[j] < from - 8) { to = s[j]; break; } }
    if (to == null) return;
    aim = to; aimAt = Date.now();
    window.scrollTo({ top: to, behavior: reduce ? "auto" : "smooth" });
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    var k = e.key, menu = $(".menu");
    if (k === "Escape" && (!menu || menu.hidden)) { location.href = back; return; }
    if (!home) return;
    if (k === "PageDown" || k === "ArrowRight" || (k === " " && !e.shiftKey)) { e.preventDefault(); move(1); }
    else if (k === "PageUp" || k === "ArrowLeft" || (k === " " && e.shiftKey)) { e.preventDefault(); move(-1); }
  });
})();
