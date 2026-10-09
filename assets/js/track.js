/*
  framefly.app page-view counter.

  One request per page load to our own API. No cookie, no third party, no fingerprint that lasts:
  the server keeps totals per day and nothing about a person (Framefly.app/api/src/traffic.ts).
  That is why there is no consent banner to go with this, and it must stay that way.

  The owner is not traffic. Two ways out:
    1. `framefly.notrack` in this browser's storage. Signing in to /admin.html sets it, so your own
       browsing stops counting from then on.
    2. ?notrack=1 on any page sets the same flag by hand (a phone, a second browser). ?notrack=0 clears it.
*/
(function () {
  var C = window.FRAMEFLY || {};
  var API = (C.apiBase || "").replace(/\/$/, "");
  var KEY = "framefly.notrack";
  if (!API) return;

  var store = null, params = null;
  try { store = window.localStorage; } catch (e) { /* storage blocked: count the view, skip the flag */ }
  try { params = new URLSearchParams(location.search); } catch (e) {}
  try {
    var flag = params && params.get("notrack");
    if (flag === "1" && store) store.setItem(KEY, "1");
    if (flag === "0" && store) store.removeItem(KEY);
    if (store && store.getItem(KEY) === "1") return; // that's me
  } catch (e) { /* unreadable storage: count it */ }

  // a local preview is not the live site
  if (location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  // the page, where the visit came from, and the tag of a link we shared (utm_source or ref), if any
  var tag = (params && (params.get("utm_source") || params.get("ref"))) || "";
  var url = API + "/view?p=" + encodeURIComponent(location.pathname) + "&r=" + encodeURIComponent(document.referrer || "") + (tag ? "&s=" + encodeURIComponent(tag) : "");

  // sendBeacon survives the page being closed and never delays it; fetch is for browsers that refuse it
  var sent = false;
  try { sent = !!(navigator.sendBeacon && navigator.sendBeacon(url)); } catch (e) { sent = false; }
  if (!sent) {
    try { fetch(url, { method: "POST", mode: "no-cors", keepalive: true }); } catch (e) { /* a missed view is not worth an error */ }
  }
})();
