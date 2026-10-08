/* Pricing page: monthly or yearly, the size of a pack, and the estimate. Prices come from src/data.mjs. */
(function () {
  "use strict";
  var FF = window.FF, D = window.FF_DATA;
  if (!FF || !D) return;
  var $ = FF.$, $$ = FF.$$;
  var plan = function (id) { return D.plans.filter(function (p) { return p.id === id; })[0]; };
  var money = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };

  // monthly or yearly
  $$("[data-cycle]").forEach(function (b) {
    b.addEventListener("click", function () {
      FF.choose(b.parentNode, b);
      var yearly = b.getAttribute("data-cycle") === "yearly";
      $$("[data-monthly]").forEach(function (el) { el.textContent = "$" + el.getAttribute(yearly ? "data-yearly" : "data-monthly"); });
    });
  });

  // 1, 5 or 15 credits
  $$("[data-pack]").forEach(function (b) {
    b.addEventListener("click", function () {
      FF.choose(b.parentNode, b);
      var n = +b.getAttribute("data-pack"), price = +b.getAttribute("data-price");
      $("[data-pack-price]").textContent = "$" + price;
      $("[data-pack-unit]").textContent = n === 1 ? "for 1 video" : "for " + n + " videos, " + money(price / n) + " each";
    });
  });

  // the estimate
  var calc = $("[data-calc]");
  if (!calc) return;
  var range = $("#calc-n", calc), presenter = $("[data-calc-presenter]", calc), yearly = $("[data-calc-yearly]", calc), long = 0;
  /** The cheapest set of packs that holds at least this many credits. */
  function packs(credits) {
    var best = [0], pick = [null];
    for (var c = 1; c <= credits; c++) {
      best[c] = Infinity;
      D.packs.forEach(function (k) {
        var rest = Math.max(0, c - k.credits), cost = best[rest] + k.price;
        if (cost < best[c]) { best[c] = cost; pick[c] = k; }
      });
    }
    var list = {}, at = credits;
    while (at > 0) { var k = pick[at]; list[k.credits] = (list[k.credits] || 0) + 1; at = Math.max(0, at - k.credits); }
    return { cost: best[credits], text: Object.keys(list).sort(function (a, b) { return b - a; }).map(function (n) { return list[n] + " x " + n + (n === "1" ? " credit" : " credits"); }).join(", ") };
  }
  function paint() {
    var n = +range.value, per = 1 + long + (presenter.checked ? 1 : 0), credits = n * per;
    $("[data-calc-n]", calc).textContent = n;
    $("[data-calc-credits]", calc).textContent = credits + (credits === 1 ? " credit" : " credits");
    var pk = packs(credits), pro = plan("pro"), studio = plan("studio");
    var proBase = yearly.checked ? pro.yearly : pro.price, studioBase = yearly.checked ? studio.yearly : studio.price;
    var rows = {
      launch: presenter.checked ? null : { cost: pk.cost, text: pk.text + ". Credits never expire." },
      pro: { cost: proBase + Math.max(0, credits - 4) * 12, text: credits > 4 ? "4 credits included, " + (credits - 4) + " more at $12 each." : "4 credits included, the rest roll over." },
      studio: { cost: studioBase + Math.max(0, credits - 15) * 9, text: credits > 15 ? "15 credits included, " + (credits - 15) + " more at $9 each." : "15 credits included, 5 seats, API." },
    };
    var low = Math.min.apply(null, Object.keys(rows).filter(function (k) { return rows[k]; }).map(function (k) { return rows[k].cost; }));
    Object.keys(rows).forEach(function (k) {
      var el = $('[data-opt="' + k + '"]', calc), r = rows[k];
      el.classList.toggle("na", !r);
      el.classList.toggle("best", !!r && r.cost === low);
      $(".amount", el).textContent = r ? money(r.cost) : "";
      $("small", el).textContent = r ? r.text : "Presenters need Pro or Studio.";
    });
  }
  range.addEventListener("input", paint);
  presenter.addEventListener("change", paint);
  yearly.addEventListener("change", paint);
  $$("[data-long]", calc).forEach(function (b) { b.addEventListener("click", function () { FF.choose(b.parentNode, b); long = +b.getAttribute("data-long"); paint(); }); });
  paint();
})();
