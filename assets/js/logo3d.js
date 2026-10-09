/* The Framefly mark as an object, from the app (app/src/components/media/Logo3D.tsx): a lime slab with real thickness, the viewfinder
   corners just off its face, and the four frames of the flight path stepping out of it towards you. Nothing but CSS 3D.
   <div data-logo3d data-size="120" data-mode="rest|loader|spin" data-interactive data-shadow></div>
   "rest" is a three-quarter view that turns to face the pointer when interactive. */
(function () {
  "use strict";
  var INK = "#12150a";
  var FRAMES = [[11.6, 20.3, 0.95], [13.9, 17.4, 1.3], [16.8, 15.4, 1.75], [20.4, 14.4, 2.7]];
  var CORNERS = '<g fill="none" stroke="' + INK + '" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 12V9.5a2 2 0 0 1 2-2H12"/><path d="M20 7.5h2.5a2 2 0 0 1 2 2V12"/><path d="M24.5 20v2.5a2 2 0 0 1-2 2H20"/><path d="M12 24.5H9.5a2 2 0 0 1-2-2V20"/></g>';
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var plane = "position:absolute;inset:0;border-radius:28%;";

  function build(host) {
    var size = +host.getAttribute("data-size") || 64, mode = host.getAttribute("data-mode") || "rest";
    var interactive = host.hasAttribute("data-interactive"), shadow = host.hasAttribute("data-shadow");
    var depth = Math.max(4, size * 0.17), slices = Math.max(6, Math.round(depth * 1.2));
    var h = "";
    if (shadow) h += '<span style="position:absolute;left:50%;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(10px);bottom:' + (-size * 0.3) + 'px;width:' + size * 0.82 + 'px;height:' + size * 0.16 + 'px;margin-left:' + (-size * 0.41) + 'px"></span>';
    h += '<span class="l3d-in" style="position:absolute;inset:0;display:block;transform-style:preserve-3d">';
    for (var i = 0; i < slices; i++) {
      var k = i / (slices - 1);
      h += '<span style="' + plane + "transform:translateZ(" + (-depth * (1 - k)) + "px);background:color-mix(in oklab,#d3f261 " + (38 + k * 34) + '%,#2f3d08)"></span>';
    }
    h += '<span style="' + plane + "transform:translateZ(" + (-depth - 0.4) + 'px) rotateY(180deg);background:linear-gradient(145deg,#5f7717,#44560f)"><svg viewBox="0 0 32 32" width="100%" height="100%" style="opacity:.55">' + CORNERS + "</svg></span>";
    var line = Math.max(1, size * 0.02);
    h += '<span style="' + plane + "transform:translateZ(.4px);background:linear-gradient(145deg,#ecfda6 0%,#d3f261 38%,#bfe04a 100%);box-shadow:inset 0 " + line + "px 0 rgba(255,255,255,.6),inset 0 " + -line + 'px 0 rgba(0,0,0,.12)"></span>';
    h += '<svg viewBox="0 0 32 32" style="' + plane + "width:100%;height:100%;transform:translateZ(.8px) translate(1.5%,2.5%);opacity:.22;filter:blur(" + size * 0.012 + 'px)">' + CORNERS + "</svg>";
    h += '<svg viewBox="0 0 32 32" style="' + plane + "width:100%;height:100%;transform:translateZ(" + depth * 0.32 + 'px)">' + CORNERS + "</svg>";
    FRAMES.forEach(function (f, n) {
      h += '<span class="l3d-dot" style="position:absolute;border-radius:50%;background:' + INK + ";left:" + ((f[0] - f[2]) / 32) * 100 + "%;top:" + ((f[1] - f[2]) / 32) * 100 + "%;width:" + ((f[2] * 2) / 32) * 100 + "%;height:" + ((f[2] * 2) / 32) * 100 + "%;transform:translateZ(" + depth * (0.3 + n * 0.42) + 'px)"></span>';
    });
    h += "</span>";
    host.style.cssText += ";position:relative;display:inline-block;flex:none;width:" + size + "px;height:" + size + "px;perspective:" + size * 4.2 + "px";
    host.innerHTML = h;
    if (!host.hasAttribute("aria-label")) host.setAttribute("aria-hidden", "true"); else host.setAttribute("role", "img");
    var inner = host.querySelector(".l3d-in"), dots = host.querySelectorAll(".l3d-dot");
    var turn = function (rx, ry) { inner.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)"; };

    if (mode !== "rest" && !reduce) {
      if (mode === "loader") {
        inner.animate([{ transform: "rotateX(14deg) rotateY(-34deg)" }, { transform: "rotateX(-6deg) rotateY(34deg)" }], { duration: 1500, easing: "ease-in-out", iterations: Infinity, direction: "alternate" });
        dots.forEach(function (d, n) {
          d.animate([{ transform: d.style.transform + " scale(1)", opacity: 0.45 }, { transform: d.style.transform + " scale(1.5)", opacity: 1 }, { transform: d.style.transform + " scale(1)", opacity: 0.45 }], { duration: 1100, easing: "ease-in-out", iterations: Infinity, delay: n * 160 });
        });
      } else {
        inner.animate([{ transform: "rotateX(12deg) rotateY(-20deg)" }, { transform: "rotateX(12deg) rotateY(340deg)" }], { duration: 3100, easing: "cubic-bezier(.65,0,.35,1)", iterations: Infinity });
      }
      return;
    }
    // at rest it looks a little past you; interactive, it turns towards the pointer, eased
    var rx = 12, ry = -20, tx = 12, ty = -20, raf = 0;
    turn(rx, ry);
    if (!interactive || reduce) return;
    function step() {
      rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14;
      turn(rx.toFixed(2), ry.toFixed(2));
      raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.05 ? requestAnimationFrame(step) : 0;
    }
    window.addEventListener("pointermove", function (e) {
      var r = host.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / Math.max(innerWidth / 2, 1), dy = (e.clientY - (r.top + r.height / 2)) / Math.max(innerHeight / 2, 1);
      ty = Math.max(-1, Math.min(1, dx)) * 34; tx = Math.max(-1, Math.min(1, dy)) * -24;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-logo3d]"), build);
})();
