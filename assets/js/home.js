/* The home page's own script: the template films play while they are on screen. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var videos = Array.prototype.slice.call(document.querySelectorAll("[data-rx-films] video"));
  if (!videos.length || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
  }, { threshold: 0.35 });
  videos.forEach(function (v) { io.observe(v); });
})();
