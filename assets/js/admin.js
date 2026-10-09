/*
  The admin page: who is on the launch list, who applied for the beta. It talks to the Framefly API
  (FRAMEFLY.apiBase) with a session that lasts until the tab is closed, 12 hours at most.

  Everything a visitor typed is written to the page as text (textContent), never as HTML: an
  application cannot run code here.
*/
(function () {
  "use strict";
  var C = window.FRAMEFLY || {}, FF = window.FF;
  var box = document.querySelector("[data-admin]");
  if (!box || !FF) return;
  var $ = function (s) { return box.querySelector(s); };
  var API = (C.apiBase || "").replace(/\/$/, "");
  var KEY = "framefly.admin.session";
  var PAGE = 50;
  var state = { type: "beta", q: "", status: "", rows: [], total: 0, open: null };

  var token = function () { try { return sessionStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  var keep = function (t) { try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY); } catch (e) {} };

  function api(path, opts) {
    opts = opts || {};
    var headers = { Authorization: "Bearer " + token() };
    if (opts.json !== undefined) headers["Content-Type"] = "application/json";
    return fetch(API + path, { method: opts.method || "GET", headers: headers, body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined }).then(function (r) {
      if (r.status === 401) { keep(""); show(false); throw new Error("Your session ended. Sign in again."); }
      if (r.status === 429) throw new Error("Too many requests. Wait a minute.");
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || "That did not work."); }, function () { throw new Error("That did not work."); });
      return opts.raw ? r : r.json();
    });
  }
  var problem = function (msg) {
    var p = $("[data-admin-problem]");
    p.hidden = !msg;
    p.querySelector("span").textContent = msg || "";
  };
  var el = function (tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) { if (k === "text") n.textContent = props[k]; else if (k === "class") n.className = props[k]; else n.setAttribute(k, props[k]); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  };
  var when = function (iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };
  var WORDS = {
    runtime: { web: "Web app", chrome: "Chrome extension", framer: "Framer plugin", other: "Something else" },
    ship: { live: "Already live", month: "This month", quarter: "Next 3 months", later: "Later" },
    demo_account: { ready: "Ready", "can-make": "Can make one", unsure: "Not sure how" },
    videos: { launch: "Launch", "product-hunt": "Product Hunt", onboarding: "Onboarding", changelog: "Changelog", store: "Store listing", social: "Social" },
  };
  var word = function (k, v) { return (WORDS[k] && WORDS[k][v]) || v || ""; };
  /** A link to the app, only when the address really is a web address. */
  function appLink(raw) {
    var href = /^https?:\/\//i.test(raw) ? raw : "https://" + raw, ok = false;
    try { ok = /^https?:$/.test(new URL(href).protocol); } catch (e) {}
    return ok && !/localhost|127\.0\.0\.1/i.test(raw) ? el("a", { class: "link", href: href, target: "_blank", rel: "noopener noreferrer nofollow", text: raw }) : el("span", { text: raw });
  }

  /* ───────── signed in or not ───────── */
  function show(inside) {
    $("[data-admin-login]").hidden = inside;
    $("[data-admin-app]").hidden = !inside;
    if (!inside) $("#admin-password").focus();
  }
  $("[data-admin-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("#admin-password"), err = $("[data-admin-error]"), btn = e.target.querySelector("button");
    var fail = function (msg) { err.hidden = false; err.querySelector("span").textContent = msg; };
    err.hidden = true;
    if (!input.value) return fail("Type the password.");
    btn.disabled = true;
    fetch(API + "/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: input.value }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }, function () { return { ok: false, status: r.status, j: {} }; }); })
      .then(function (r) {
        if (!r.ok) return fail(r.status === 429 ? "Too many attempts. Wait 15 minutes before trying again." : r.j.error || "That did not work.");
        input.value = "";
        keep(r.j.token);
        try { localStorage.setItem("framefly.notrack", "1"); } catch (x) {}
        show(true);
        refresh();
      })
      .catch(function () { fail("The server did not answer. Check your connection."); })
      .then(function () { btn.disabled = false; });
  });
  $("[data-admin-out]").addEventListener("click", function () {
    api("/admin/logout", { method: "POST", json: {} }).catch(function () {}).then(function () { keep(""); show(false); });
  });

  /* ───────── the numbers ───────── */
  function overview() {
    return api("/admin/overview").then(function (o) {
      var days = {}, week = 0, cut = Date.now() - 7 * 864e5;
      o.perDay.forEach(function (d) {
        (days[d.day] = days[d.day] || { beta: 0, notify: 0 })[d.type] = d.n;
        if (new Date(d.day + "T23:59:59Z").getTime() >= cut) week += d.n;
      });
      box.querySelector('[data-n="beta"]').textContent = o.counts.beta;
      box.querySelector('[data-n="betaNew"]').textContent = o.counts.betaNew;
      box.querySelector('[data-n="notify"]').textContent = o.counts.notify;
      box.querySelector('[data-n="week"]').textContent = week;
      // thirty days, one bar each: launch list under, beta applications on top
      var wrap = $("[data-admin-days]"), max = 1, list = [];
      for (var i = 29; i >= 0; i--) {
        var key = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), v = days[key] || { beta: 0, notify: 0 };
        list.push({ key: key, v: v });
        max = Math.max(max, v.beta + v.notify);
      }
      wrap.textContent = "";
      list.forEach(function (d) {
        var total = d.v.beta + d.v.notify;
        wrap.appendChild(el("div", { class: "admin-day", title: d.key + ": " + d.v.beta + " beta, " + d.v.notify + " launch list" }, [
          el("i", { class: "b", style: "height:" + (d.v.beta / max) * 100 + "%" }),
          el("i", { class: "n", style: "height:" + (d.v.notify / max) * 100 + "%" }),
          total ? null : el("i", { class: "z" }),
        ]));
      });
    });
  }

  /* ───────── the list ───────── */
  function load(more) {
    var q = "?type=" + state.type + "&limit=" + PAGE + "&offset=" + (more ? state.rows.length : 0) + (state.q ? "&q=" + encodeURIComponent(state.q) : "") + (state.type === "beta" && state.status ? "&status=" + state.status : "");
    return api("/admin/signups" + q).then(function (r) {
      state.rows = more ? state.rows.concat(r.rows) : r.rows;
      state.total = r.total;
      draw();
    });
  }
  function refresh() {
    problem("");
    return Promise.all([overview(), load(false)]).catch(function (e) { problem(e.message); });
  }

  function statusSelect(row) {
    var sel = el("select", { class: "control admin-status", "aria-label": "Status of " + row.email, "data-s": row.status });
    ["new", "contacted", "accepted", "declined"].forEach(function (s) {
      var o = el("option", { value: s, text: s.charAt(0).toUpperCase() + s.slice(1) });
      if (s === row.status) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("click", function (e) { e.stopPropagation(); });
    sel.addEventListener("change", function () {
      api("/admin/signups/" + row.id, { method: "PATCH", json: { status: sel.value } }).then(function (r) { row.status = r.status; sel.setAttribute("data-s", r.status); return overview(); }).catch(function (e) { problem(e.message); sel.value = row.status; });
    });
    return sel;
  }
  function removeButton(row) {
    var b = el("button", { class: "btn btn-secondary btn-sm", type: "button", text: "Delete" }), armed = 0;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      // twice to delete: the first press asks
      if (!armed) { b.textContent = "Delete for good?"; b.classList.add("danger"); armed = setTimeout(function () { armed = 0; b.textContent = "Delete"; b.classList.remove("danger"); }, 4000); return; }
      clearTimeout(armed);
      api("/admin/signups/" + row.id, { method: "DELETE" }).then(refresh).catch(function (e) { problem(e.message); });
    });
    return b;
  }
  function detail(row, span) {
    var note = el("textarea", { class: "control", rows: "2", placeholder: "A note for yourself", "aria-label": "Your note about " + row.email });
    note.value = row.admin_note || "";
    var saved = el("span", { class: "muted", text: "" });
    var save = el("button", { class: "btn btn-secondary btn-sm", type: "button", text: "Save note" });
    save.addEventListener("click", function () {
      api("/admin/signups/" + row.id, { method: "PATCH", json: { admin_note: note.value } }).then(function (r) { row.admin_note = r.admin_note; saved.textContent = "Saved"; setTimeout(function () { saved.textContent = ""; }, 1800); }).catch(function (e) { problem(e.message); });
    });
    var fact = function (k, v) { return v ? el("div", {}, [el("dt", { text: k }), el("dd", { text: v })]) : null; };
    return el("tr", { class: "admin-detail" }, [el("td", { colspan: String(span) }, [
      el("dl", { class: "facts" }, [fact("Name", row.name), fact("Ships", word("ship", row.ship)), fact("Demo account", word("demo_account", row.demo_account)), fact("Applied from", row.page), fact("Updated", row.updated_at !== row.created_at ? when(row.updated_at) : "")]),
      row.note ? el("p", { class: "admin-note", text: row.note }) : null,
      note,
      el("div", { class: "admin-actions" }, [save, saved, el("a", { class: "btn btn-secondary btn-sm", href: "mailto:" + encodeURIComponent(row.email).replace(/%40/g, "@"), text: "Write to them" }), removeButton(row)]),
    ])]);
  }
  function draw() {
    var table = $("[data-admin-table]"), head = table.tHead, body = table.tBodies[0], beta = state.type === "beta";
    var cols = beta ? ["Applied", "Email", "App", "What", "Videos", "Status"] : ["Signed up", "Email", ""];
    head.textContent = "";
    head.appendChild(el("tr", {}, cols.map(function (c) { return el("th", { scope: "col", text: c }); })));
    body.textContent = "";
    state.rows.forEach(function (row) {
      var cells = beta
        ? [el("td", { text: when(row.created_at) }), el("td", {}, [el("b", { text: row.email })]), el("td", {}, [appLink(row.app_url || "")]), el("td", { text: word("runtime", row.runtime) }), el("td", { text: row.videos.map(function (v) { return word("videos", v); }).join(", ") }), el("td", {}, [statusSelect(row)])]
        : [el("td", { text: when(row.created_at) }), el("td", {}, [el("b", { text: row.email })]), el("td", { class: "admin-right" }, [removeButton(row)])];
      var tr = el("tr", { class: beta ? "admin-row" : "" }, cells);
      body.appendChild(tr);
      if (!beta) return;
      tr.tabIndex = 0;
      tr.setAttribute("aria-expanded", String(state.open === row.id));
      var toggle = function () { state.open = state.open === row.id ? null : row.id; draw(); };
      tr.addEventListener("click", function (e) { if (!e.target.closest("a, select, button")) toggle(); });
      tr.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target === tr) toggle(); });
      if (state.open === row.id) body.appendChild(detail(row, cols.length));
    });
    table.parentNode.hidden = !state.rows.length;
    $("[data-admin-empty]").hidden = !!state.rows.length;
    $("[data-admin-empty]").textContent = state.q || state.status ? "Nothing matches." : beta ? "No application yet." : "Nobody on the list yet.";
    $("[data-admin-count]").textContent = state.rows.length ? state.rows.length + " of " + state.total : "";
    $("[data-admin-more]").hidden = state.rows.length >= state.total;
    $("[data-admin-status]").hidden = !beta;
  }

  /* ───────── the bar above it ───────── */
  Array.prototype.forEach.call(box.querySelectorAll("[data-admin-type]"), function (b) {
    b.addEventListener("click", function () {
      FF.choose(b.parentNode, b);
      state.type = b.getAttribute("data-admin-type");
      state.open = null;
      load(false).catch(function (e) { problem(e.message); });
    });
  });
  var typing = 0;
  $("[data-admin-q]").addEventListener("input", function (e) {
    clearTimeout(typing);
    typing = setTimeout(function () { state.q = e.target.value.trim(); load(false).catch(function (x) { problem(x.message); }); }, 350);
  });
  $("[data-admin-status]").addEventListener("change", function (e) { state.status = e.target.value; load(false).catch(function (x) { problem(x.message); }); });
  $("[data-admin-more]").addEventListener("click", function () { load(true).catch(function (e) { problem(e.message); }); });
  $("[data-admin-export]").addEventListener("click", function () {
    api("/admin/export.csv?type=" + state.type, { raw: true }).then(function (r) { return r.blob(); }).then(function (blob) {
      var a = el("a", { href: URL.createObjectURL(blob), download: "framefly-" + state.type + "-" + new Date().toISOString().slice(0, 10) + ".csv" });
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }).catch(function (e) { problem(e.message); });
  });

  /* ───────── traffic ───────── */
  var days = 30, seen = false;
  var KIND = { search: "Search engine", ai: "AI assistant", social: "Social, community", campaign: "Tagged link", direct: "Direct", site: "Other site", other: "Other" };
  var sourceName = function (s) { return s === "direct" ? "Direct (typed, bookmark, app)" : s.indexOf("tag:") === 0 ? "?ref=" + s.slice(4) : s; };
  function traffic() {
    return api("/admin/traffic?days=" + days).then(function (r) {
      seen = true;
      var set = function (k, v) { box.querySelector('[data-t="' + k + '"]').textContent = v; };
      var signups = r.signups.beta + r.signups.notify;
      set("views", r.totals.views);
      set("visitors", r.totals.visitors);
      set("visits", r.totals.visits);
      set("rate", r.totals.visitors ? (Math.round((signups / r.totals.visitors) * 1000) / 10).toString() : "0");
      // one bar per day, days with nothing included
      var by = {}, max = 1, wrap = $("[data-traffic-days]");
      r.days.forEach(function (d) { by[d.day] = d; max = Math.max(max, d.views); });
      wrap.textContent = "";
      for (var i = days - 1; i >= 0; i--) {
        var key = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), d = by[key];
        wrap.appendChild(el("div", { class: "admin-day", title: key + ": " + (d ? d.views + " views, " + d.visitors + " visitors" : "nothing") }, [d ? el("i", { class: "b", style: "height:" + (d.views / max) * 100 + "%" }) : el("i", { class: "z" })]));
      }
      // arrivals by family of source
      var kinds = {}, order = ["search", "ai", "social", "campaign", "site", "direct", "other"], kw = $("[data-traffic-kinds]");
      r.sources.forEach(function (s) { kinds[s.kind] = (kinds[s.kind] || 0) + s.visits; });
      kw.textContent = "";
      order.forEach(function (k) { if (kinds[k]) kw.appendChild(el("span", { class: "chip chip-line" }, [el("b", { text: String(kinds[k]) }), el("span", { text: KIND[k] })])); });
      var fill = function (sel, rows, none, span) {
        var body = $(sel).tBodies[0];
        body.textContent = "";
        rows.forEach(function (tr) { body.appendChild(tr); });
        if (!rows.length) body.appendChild(el("tr", {}, [el("td", { colspan: String(span), class: "muted", text: none })]));
      };
      fill("[data-traffic-sources]", r.sources.map(function (s) { return el("tr", {}, [el("td", { text: sourceName(s.source) }), el("td", { class: "muted", text: KIND[s.kind] || s.kind }), el("td", { class: "admin-right", text: String(s.visits) })]); }), "No visit counted yet.", 3);
      fill("[data-traffic-pages]", r.pages.map(function (p) { return el("tr", {}, [el("td", { text: p.path }), el("td", { class: "admin-right", text: String(p.views) })]); }), "No page viewed yet.", 2);
    });
  }
  Array.prototype.forEach.call(box.querySelectorAll("[data-days]"), function (b) {
    b.addEventListener("click", function () { FF.choose(b.parentNode, b); days = +b.getAttribute("data-days"); traffic().catch(function (e) { problem(e.message); }); });
  });
  Array.prototype.forEach.call(box.querySelectorAll("[data-admin-view]"), function (b) {
    b.addEventListener("click", function () {
      FF.choose(b.parentNode, b);
      var view = b.getAttribute("data-admin-view");
      Array.prototype.forEach.call(box.querySelectorAll("[data-view]"), function (v) { v.hidden = v.getAttribute("data-view") !== view; });
      problem("");
      if (view === "traffic") traffic().catch(function (e) { problem(e.message); });
    });
  });

  if (!API) { $("[data-admin-error]").hidden = false; $("[data-admin-error] span").textContent = "No API address in assets/js/config.js."; }
  if (token()) { show(true); refresh(); } else show(false);
})();
