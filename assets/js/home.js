/* Home page demos. Each one only runs while it is on screen, and stays still under reduced motion. */
(function () {
  "use strict";
  var FF = window.FF || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = FF.reduce;

  function whileVisible(el, start, stop) {
    if (!el) return;
    if (reduce) return;
    FF.onView(el, function (v) { v ? start() : stop(); }, { threshold: 0.2 });
  }

  /* Styles rail */
  var rail = $("[data-style-rail]");
  if (rail && FF.styles) FF.styles.forEach(function (t) { rail.appendChild(FF.styleCard(t, { appName: "Your app" })); });

  /* 2FA code: a new code every 30 seconds, like an authenticator. */
  var code = $("[data-totp]"), ring = $("[data-totp-ring]");
  if (code && ring) {
    var C = 56.55;
    var hash = function (n) { var x = Math.sin(n * 12.9898) * 43758.5453; return Math.floor((x - Math.floor(x)) * 1e6); };
    var paintTotp = function () {
      var now = Date.now() / 1000, win = Math.floor(now / 30), left = 30 - (now % 30);
      var c = String(hash(win)).padStart(6, "0");
      code.textContent = c.slice(0, 3) + " " + c.slice(3);
      ring.style.strokeDashoffset = String(C * (1 - left / 30));
    };
    paintTotp();
    var totpTimer = null;
    whileVisible(ring.closest(".tile"), function () { if (!totpTimer) totpTimer = setInterval(paintTotp, 1000); }, function () { clearInterval(totpTimer); totpTimer = null; });
  }

  /* Voice: a waveform that plays, and the language it speaks. */
  var wave = $("[data-wave]"), langEl = $("[data-lang]");
  if (wave) {
    var BARS = 44;
    for (var i = 0; i < BARS; i++) {
      var env = Math.sin((i / BARS) * Math.PI) * 0.6 + 0.4;
      var r = Math.abs(Math.sin(i * 7.13) * Math.cos(i * 2.31));
      var s = document.createElement("span");
      s.style.setProperty("--h", Math.max(12, env * (35 + r * 65)) + "%");
      wave.appendChild(s);
    }
    var bars = wave.children;
    var langs = ["English", "Français", "Deutsch", "Español", "Italiano", "Português", "Nederlands", "Polski", "日本語", "Türkçe", "Svenska", "हिन्दी"];
    var li = 0, t0 = 0, raf = null;
    var frame = function (ts) {
      if (!t0) t0 = ts;
      var p = ((ts - t0) % 2600) / 2600;
      var on = Math.floor(p * BARS * 1.15);
      for (var k = 0; k < BARS; k++) bars[k].classList.toggle("on", k < on);
      if (ts - t0 >= 2600) {
        t0 = ts;
        li = (li + 1) % langs.length;
        langEl.classList.add("out");
        setTimeout(function () { langEl.textContent = langs[li]; langEl.classList.remove("out"); }, 180);
      }
      raf = requestAnimationFrame(frame);
    };
    whileVisible(wave.closest(".tile"), function () { if (!raf) { t0 = 0; raf = requestAnimationFrame(frame); } }, function () { cancelAnimationFrame(raf); raf = null; });
  }

  /* Karaoke captions */
  var kar = $("[data-karaoke]");
  if (kar) {
    var words = kar.textContent.trim().split(" ");
    kar.innerHTML = words.map(function (w) { return "<span>" + w + "</span>"; }).join(" ");
    var spans = kar.children, wi = -1, kTimer = null;
    var step = function () {
      wi = wi + 1 > words.length + 3 ? 0 : wi + 1;
      for (var k = 0; k < spans.length; k++) { spans[k].classList.toggle("on", k < wi); spans[k].classList.toggle("now", k === wi); }
    };
    whileVisible(kar, function () { if (!kTimer) kTimer = setInterval(step, 330); }, function () { clearInterval(kTimer); kTimer = null; });
  }

  /* Guardrail log */
  var log = $("[data-log]");
  if (log) {
    var I = function (n) { return FF.icon(n); };
    var events = [
      ["Click “Invoices” in the sidebar", true],
      ["Click “Delete invoice” on /invoices/2291", false, "Hard block list", "destructive action"],
      ["Type “Studio Maren” into “Search clients”", true],
      ["Click “Upgrade to Pro”", false, "Hard block list", "payments and checkout"],
      ["Open /reports and click “Export CSV”", true],
      ["Click “Send reminder” to a real client", false, "Hard block list", "outbound messages"],
      ["Click “Archive client”", false, "Guard model", "risky, hard to undo"],
      ["Open the invoice builder", true],
      ["Open /settings/billing", false, "Your rules", "Billing is excluded"],
      ["Click “Sign out”", false, "Hard block list", "keeps the session alive"],
      ["Scroll the payments table", true],
    ];
    var n = 0, sec = 7 * 3600 + 12 * 60 + 4, lTimer = null;
    var fmt = function (s) { return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(function (v) { return String(v).padStart(2, "0"); }).join(":"); };
    var add = function () {
      var e = events[n % events.length];
      n++;
      sec += 1 + (n % 3);
      var line = document.createElement("div");
      line.className = "log-line";
      line.innerHTML = '<span class="t">' + fmt(sec) + '</span><span><span class="a">' + e[0] + "</span><br>" +
        (e[1] ? '<span class="v ok">' + I("check-circle") + "Allowed</span>" : '<span class="v no">' + I("prohibit") + "Blocked <em>by " + e[2] + ", " + e[3] + "</em></span>") + "</span>";
      log.appendChild(line);
      while (log.children.length > 8) log.removeChild(log.firstChild);
    };
    for (var j = 0; j < 6; j++) add();
    whileVisible(log, function () { if (!lTimer) lTimer = setInterval(add, 1700); }, function () { clearInterval(lTimer); lTimer = null; });
  }
})();
