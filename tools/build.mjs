// Builds the site: every page in src/pages becomes a plain HTML file at the root, which is what
// GitHub Pages serves. Run it after any change in src/:
//
//   node tools/build.mjs
//
// A page is its own HTML with a few facts in a comment at the top (title, description...). The build
// adds the head, the nav and the footer (src/partials), and expands:
//
//   {{icon:name}}  {{icon:name:class}}   a Phosphor icon (name-fill and name-bold pick the weight)
//   {{mark}}                             the Framefly mark
//   {{shot:name|What it shows}}          a screenshot of the app, in both themes (assets/app)
//   {{block:name}}                       a block made from src/data.mjs (src/blocks.mjs)
//
// It also writes assets/js/data.js (what the interactive parts need), assets/img/icons.svg (only the
// icons the pages use, read from the app's Phosphor package) and sitemap.xml.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as data from "../src/data.mjs";
import { blocks } from "../src/blocks.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const read = (p) => readFileSync(p, "utf8");

// ── the films as they are on disk (tools/media.mjs wrote this) ──
const filmsFile = join(root, "assets", "films", "films.json");
const filmMeta = existsSync(filmsFile) ? JSON.parse(read(filmsFile)) : {};
for (const t of data.templates) t.film = filmMeta[t.id] ?? { seconds: 0, filmSeconds: 0, full: false, sound: false, w: 1920, h: 1080 };

const MARK =
  '<svg class="mark-svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#d3f261"/><g fill="none" stroke="#12150a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 12V9.5a2 2 0 0 1 2-2H12M20 7.5h2.5a2 2 0 0 1 2 2V12M24.5 20v2.5a2 2 0 0 1-2 2H20M12 24.5H9.5a2 2 0 0 1-2-2V20"/></g><g fill="#12150a"><circle cx="11.6" cy="20.3" r=".95"/><circle cx="13.9" cy="17.4" r="1.3"/><circle cx="16.8" cy="15.4" r="1.75"/><circle cx="20.4" cy="14.4" r="2.7"/></g></svg>';

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const icons = new Set();
export const icon = (name, cls = "") => {
  icons.add(name);
  return `<svg class="icon${cls ? " " + cls : ""}" aria-hidden="true"><use href="assets/img/icons.svg#i-${name}"></use></svg>`;
};

/** A screenshot of the app: the light one and the dark one, the page's theme shows one of them. */
export function shot(name, alt, cls = "") {
  const img = (theme) =>
    `<img class="only-${theme}" src="assets/app/${name}.${theme}.webp" srcset="assets/app/${name}.${theme}.sm.webp 1200w, assets/app/${name}.${theme}.webp 2400w" sizes="(max-width: 900px) 94vw, (max-width: 1400px) 62vw, 860px" width="2400" height="1350" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  if (!existsSync(join(root, "assets", "app", `${name}.light.webp`))) console.warn("! missing screenshot:", name);
  return `<div class="shot${cls ? " " + cls : ""}">${img("light")}${img("dark")}</div>`;
}

const ctx = { data, icon, shot, esc, MARK };

function expand(html) {
  return html
    .replace(/\{\{block:([a-z0-9-]+)\}\}/g, (_, n) => {
      if (!blocks[n]) throw new Error("no block named " + n);
      return expand(blocks[n](ctx));
    })
    .replace(/\{\{shot:([a-z0-9-]+)\|([^}|]*)(?:\|([^}]*))?\}\}/g, (_, n, alt, cls) => shot(n, alt, cls))
    .replace(/\{\{icon:([a-z0-9-]+)(?::([a-z0-9 -]+))?\}\}/g, (_, n, c) => icon(n, c))
    .replace(/\{\{mark\}\}/g, MARK);
}

// ── pages ──
const partial = (n) => read(join(src, "partials", `${n}.html`)).trim();
const pages = readdirSync(join(src, "pages")).filter((f) => f.endsWith(".html"));
const sitemap = [];

for (const file of pages) {
  const raw = read(join(src, "pages", file));
  const m = /^<!--([\s\S]*?)-->/.exec(raw);
  if (!m) throw new Error(file + ": no facts at the top");
  const meta = Object.fromEntries(m[1].trim().split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
  const body = raw.slice(m[0].length).trim();
  const url = file === "index.html" ? `${data.brand.url}/` : `${data.brand.url}/${file}`;
  const bare = meta.bare === "yes"; // a page that is only a redirect
  if (meta.sitemap !== "no") sitemap.push({ url, priority: meta.priority ?? "0.6" });

  const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
${meta.description ? `<meta name="description" content="${esc(meta.description)}">` : ""}
${meta.robots ? `<meta name="robots" content="${meta.robots}">` : ""}
<link rel="canonical" href="${meta.canonical ?? url}">
<meta property="og:title" content="${esc(meta.og_title ?? meta.title)}">
<meta property="og:description" content="${esc(meta.og_description ?? meta.description ?? "")}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Framefly">
<meta property="og:type" content="website">
<meta property="og:image" content="${data.brand.url}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:creator" content="@MarindeVanssay">
<meta name="theme-color" content="#f3f3f4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141518" media="(prefers-color-scheme: dark)">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="assets/fonts/gabarito-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<script>(function(){var d=document.documentElement,t;try{t=localStorage.getItem("framefly.site.theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.setAttribute("data-theme",t);d.classList.add("js")})()</script>
${meta.head ?? ""}`;

  const scripts = ["config", "data", "site", ...(meta.scripts ? meta.scripts.split(",").map((s) => s.trim()) : [])].map((s) => `<script src="assets/js/${s}.js" defer></script>`).join("\n");
  const nav = partial("nav").replace(`href="${file}" class="nav-link"`, `href="${file}" class="nav-link" aria-current="page"`);
  const html = bare
    ? `<!doctype html>\n<html lang="en">\n<head>\n${head}\n</head>\n<body>\n${expand(body)}\n</body>\n</html>\n`
    : `<!doctype html>
<html lang="en">
<head>
${head}
</head>
<body class="page-${file.replace(".html", "")}">
${expand(nav)}
<main id="main">
${expand(body)}
</main>
${expand(partial("footer"))}
${scripts}
</body>
</html>
`;
  writeFileSync(join(root, file), html.replace(/\n{3,}/g, "\n\n"));
  console.log("built", file);
}

// ── what the interactive parts read ──
const client = {
  templates: data.templates.map(({ id, name, kind, line, brief, film }) => ({ id, name, kind, line, brief, film })),
  captions: data.captions,
  captionAccents: data.captionAccents,
  backgrounds: data.backgrounds,
  scenes: data.scenes,
  presenters: data.presenters,
  layout: data.layout,
  stageLine: data.stageLine,
  plans: data.plans.map(({ id, name, price, yearly }) => ({ id, name, price, yearly })),
  packs: data.packs,
};
writeFileSync(join(root, "assets", "js", "data.js"), `/* Written by tools/build.mjs from src/data.mjs. Do not edit by hand. */\nwindow.FF_DATA = ${JSON.stringify(client)};\n`);

// ── the icons the site uses, from the app's Phosphor package ──
for (const f of readdirSync(join(root, "assets", "js")).filter((f) => f.endsWith(".js"))) for (const m of read(join(root, "assets", "js", f)).matchAll(/icon\("([a-z0-9-]+)"/g)) icons.add(m[1]);
const defs = join(root, "..", "Framefly.app", "app", "node_modules", "@phosphor-icons", "react", "dist", "defs");
const spriteFile = join(root, "assets", "img", "icons.svg");
if (existsSync(defs)) {
  const kebab = (k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
  const draw = (el) => {
    if (el == null || typeof el !== "object") return "";
    if (Array.isArray(el)) return el.map(draw).join("");
    const kids = draw(el.props?.children);
    if (typeof el.type !== "string") return kids; // a fragment
    const attrs = Object.entries(el.props ?? {}).filter(([k]) => k !== "children").map(([k, v]) => ` ${kebab(k)}="${v}"`).join("");
    return kids ? `<${el.type}${attrs}>${kids}</${el.type}>` : `<${el.type}${attrs}/>`;
  };
  let sprite = '<svg xmlns="http://www.w3.org/2000/svg">';
  for (const name of [...icons].sort()) {
    const w = /-(fill|bold)$/.exec(name);
    const base = w ? name.slice(0, -w[0].length) : name;
    const file = join(defs, base.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("") + ".es.js");
    if (!existsSync(file)) {
      console.warn("! no Phosphor icon named", base);
      continue;
    }
    const mod = await import(pathToFileURL(file).href);
    sprite += `<symbol id="i-${name}" viewBox="0 0 256 256">${draw(mod.default.get(w ? w[1] : "regular"))}</symbol>`;
  }
  mkdirSync(dirname(spriteFile), { recursive: true });
  writeFileSync(spriteFile, sprite + "</svg>\n");
  console.log("icons:", icons.size);
} else {
  const have = existsSync(spriteFile) ? read(spriteFile) : "";
  const missing = [...icons].filter((n) => !have.includes(`id="i-${n}"`));
  if (missing.length) console.warn("! the app repo is not next to this one, and these icons are not in the sprite:", missing.join(", "));
}

writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((p) => `  <url><loc>${p.url}</loc><priority>${p.priority}</priority></url>`).join("\n")}\n</urlset>\n`);
console.log("done:", pages.length, "pages");
