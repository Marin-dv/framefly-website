// Copies the shared blocks in partials/ into every page, between <!-- @name --> and <!-- /@name --> markers,
// marks the current page in the nav, and expands shorthand tokens in place:
//   {{i:name}} or {{i:name extra-class}}  ->  a Phosphor icon from assets/img/icons.svg
//   {{mark}} or {{mark extra-class}}      ->  the Framefly logo mark
// Run after editing a partial:  node tools/stamp.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const partial = (n) => readFileSync(join(root, "partials", `${n}.html`), "utf8").trimEnd();
const blocks = ["head", "nav", "footer", "scripts"];
const MARK =
  '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#d3f261"/><g fill="none" stroke="#12150a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 12V9.5a2 2 0 0 1 2-2H12M20 7.5h2.5a2 2 0 0 1 2 2V12M24.5 20v2.5a2 2 0 0 1-2 2H20M12 24.5H9.5a2 2 0 0 1-2-2V20"/></g><g fill="#12150a"><circle cx="11.6" cy="20.3" r=".95"/><circle cx="13.9" cy="17.4" r="1.3"/><circle cx="16.8" cy="15.4" r="1.75"/><circle cx="20.4" cy="14.4" r="2.7"/></g></svg>';

const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
for (const page of pages) {
  let html = readFileSync(join(root, page), "utf8");
  for (const b of blocks) {
    const re = new RegExp("(<!-- @" + b + " -->)[\\s\\S]*?(<!-- /@" + b + " -->)");
    if (!re.test(html)) continue;
    let body = partial(b);
    if (b === "nav") body = body.replace(`<a href="${page}">`, `<a href="${page}" aria-current="page">`);
    html = html.replace(re, (_, open, close) => `${open}\n${body}\n${close}`);
  }
  html = html.replace(/\{\{i:([a-z0-9-]+)(?: ([a-z0-9 -]+))?\}\}/g, (_, n, c) =>
    `<svg class="icon${c ? " " + c : ""}" aria-hidden="true"><use href="assets/img/icons.svg#i-${n}"></use></svg>`);
  html = html.replace(/\{\{mark(?: ([a-z0-9 -]+))?\}\}/g, (_, c) => (c ? MARK.replace("<svg ", `<svg class="${c}" `) : MARK));
  writeFileSync(join(root, page), html);
  console.log("stamped", page);
}
