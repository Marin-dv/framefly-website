// Builds the site: every page in src/pages becomes a plain HTML file at the root, and every
// article in src/articles a page under articles/. That is what GitHub Pages serves. Run it after
// any change in src/:
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
// It also writes what search engines and AI assistants read: structured data in each page,
// sitemap.xml, articles/feed.xml, llms.txt and llms-full.txt; plus assets/js/data.js (what the
// interactive parts need) and assets/img/icons.svg (only the icons the pages use).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as data from "../src/data.mjs";
import { blocks } from "../src/blocks.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const read = (p) => readFileSync(p, "utf8");
const SITE = data.brand.url;

// ── the films as they are on disk (tools/media.mjs wrote this) ──
const filmsFile = join(root, "assets", "films", "films.json");
const filmMeta = existsSync(filmsFile) ? JSON.parse(read(filmsFile)) : {};
for (const t of data.templates) t.film = filmMeta[t.id] ?? { seconds: 0, filmSeconds: 0, full: false, sound: false, w: 1920, h: 1080 };

const MARK =
  '<svg class="mark-svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#d3f261"/><g fill="none" stroke="#12150a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 12V9.5a2 2 0 0 1 2-2H12M20 7.5h2.5a2 2 0 0 1 2 2V12M24.5 20v2.5a2 2 0 0 1-2 2H20M12 24.5H9.5a2 2 0 0 1-2-2V20"/></g><g fill="#12150a"><circle cx="11.6" cy="20.3" r=".95"/><circle cx="13.9" cy="17.4" r="1.3"/><circle cx="16.8" cy="15.4" r="1.75"/><circle cx="20.4" cy="14.4" r="2.7"/></g></svg>';

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** What a reader sees of some HTML: no tags, no icons, one space between words. */
const plain = (html) => html.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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

// ── articles: read first, so pages can list them ──
const facts = (raw, file) => {
  const m = /^<!--([\s\S]*?)-->/.exec(raw);
  if (!m) throw new Error(file + ": no facts at the top");
  return { meta: Object.fromEntries(m[1].trim().split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()])), body: raw.slice(m[0].length).trim() };
};
const articlesDir = join(src, "articles");
const articles = (existsSync(articlesDir) ? readdirSync(articlesDir) : [])
  .filter((f) => f.endsWith(".html"))
  .map((f) => {
    const { meta, body } = facts(read(join(articlesDir, f)), f);
    for (const k of ["title", "description", "lead", "date"]) if (!meta[k]) throw new Error(`${f}: an article needs "${k}"`);
    if (!/<h2 id="sources"/.test(body)) throw new Error(`${f}: an article ends with its sources (<h2 id="sources">)`);
    const slug = f.replace(/\.html$/, "");
    return { slug, ...meta, body, url: `${SITE}/articles/${slug}`, updated: meta.updated ?? meta.date, minutes: Math.max(2, Math.round(plain(body).split(" ").length / 220)) };
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
const longDate = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const ctx = { data, icon, shot, esc, MARK, articles, longDate };

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

// ── structured data ──
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const org = { "@type": "Organization", "@id": `${SITE}/#org`, name: "Framefly", url: SITE, logo: `${SITE}/assets/img/icon-512.png`, email: data.brand.email, founder: { "@type": "Person", name: "Marin de Vanssay", url: "https://vanssay.net" }, sameAs: [data.brand.x] };
/** Questions and answers a page shows in <details>, as FAQPage data. The answer is exactly the text on the page. */
function faqOf(html) {
  const qa = [...html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map((m) => ({ q: plain(m[1]), a: plain(m[2]) })).filter((x) => x.q.endsWith("?") && x.a);
  return qa.length ? ld({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) }) : "";
}
const crumbs = (list) => ld({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: list.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })) });

// ── one page, from its facts and its body ──
const sitemap = [];
function page({ file, meta, body, kind = "page" }) {
  const depth = file.split("/").length - 1;
  const up = "../".repeat(depth);
  // "index.html" is the folder, and an article has no ".html" in its address
  const url = meta.url ?? `${SITE}/${file.replace(/(^|\/)index\.html$/, "$1")}`;
  const bare = meta.bare === "yes";
  if (meta.sitemap !== "no") sitemap.push({ url, priority: meta.priority ?? "0.6", lastmod: meta.updated ?? meta.date });
  const inner = expand(body);

  const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)}</title>
${meta.description ? `<meta name="description" content="${esc(meta.description)}">` : ""}
${meta.robots ? `<meta name="robots" content="${meta.robots}">` : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'}
<link rel="canonical" href="${meta.canonical ?? url}">
<meta property="og:title" content="${esc(meta.og_title ?? meta.title)}">
<meta property="og:description" content="${esc(meta.og_description ?? meta.description ?? "")}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Framefly">
<meta property="og:type" content="${kind === "article" ? "article" : "website"}">
<meta property="og:image" content="${SITE}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
${kind === "article" ? `<meta property="article:published_time" content="${meta.date}">\n<meta property="article:modified_time" content="${meta.updated ?? meta.date}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:creator" content="@MarindeVanssay">
<meta name="theme-color" content="#f3f3f4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141518" media="(prefers-color-scheme: dark)">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="alternate" type="application/atom+xml" title="Framefly articles" href="articles/feed.xml">
<link rel="preload" href="assets/fonts/gabarito-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<script>(function(){var d=document.documentElement,t;try{t=localStorage.getItem("framefly.site.theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.setAttribute("data-theme",t);d.classList.add("js")})()</script>
${meta.head ?? ""}
${meta.ld ?? ""}${meta.robots?.includes("noindex") ? "" : faqOf(inner)}`;

  // every page counts its own view, except the admin (whoever opens it is the owner, not a visitor)
  const scripts = ["config", "data", "site", ...(meta.scripts ? meta.scripts.split(",").map((s) => s.trim()) : []), ...(meta.track === "no" ? [] : ["track"])].map((s) => `<script src="assets/js/${s}.js" defer></script>`).join("\n");
  const navFile = file.startsWith("articles/") ? "articles/" : file;
  const nav = partial("nav").replace(`href="${navFile}" class="nav-link"`, `href="${navFile}" class="nav-link" aria-current="page"`);
  let html = bare
    ? `<!doctype html>\n<html lang="en">\n<head>\n${head}\n</head>\n<body>\n${inner}\n</body>\n</html>\n`
    : `<!doctype html>
<html lang="en" data-root="${up}">
<head>
${head}
</head>
<body class="page-${file.replace(/\.html$/, "").replace(/\//g, "-")}">
${expand(nav)}
<main id="main">
${inner}
</main>
${expand(partial("footer"))}
${scripts}
</body>
</html>
`;
  // a page in a folder reaches the site's files one level up
  if (depth) html = html.replace(/\b(href|src|poster)="(?!https?:|mailto:|data:|#|\/)([^"]*)"/g, (_, a, v) => `${a}="${up}${v}"`).replace(/\bsrcset="([^"]*)"/g, (_, v) => `srcset="${v.split(",").map((p) => up + p.trim()).join(", ")}"`);
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), html.replace(/\n{3,}/g, "\n\n"));
  console.log("built", file);
}

const partial = (n) => read(join(src, "partials", `${n}.html`)).trim();

// ── pages ──
const pages = readdirSync(join(src, "pages")).filter((f) => f.endsWith(".html"));
for (const file of pages) {
  const { meta, body } = facts(read(join(src, "pages", file)), file);
  if (file === "index.html") meta.ld = (meta.ld ?? "") + ld({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebSite", "@id": `${SITE}/#site`, url: SITE, name: "Framefly", description: data.brand.tagline, publisher: { "@id": `${SITE}/#org` }, inLanguage: "en" }] });
  page({ file, meta, body });
}

// ── articles: each one, then the list of them ──
for (const a of articles) {
  const toc = [...a.body.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], text: plain(m[2]) }));
  const others = articles.filter((x) => x.slug !== a.slug).slice(0, 4);
  const body = `<div class="wrap article-layout">
<article class="article">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="articles/">Articles</a><span aria-hidden="true">/</span><span>${esc(a.category ?? "Guide")}</span></nav>
  <h1>${a.h1 ?? esc(a.title)}</h1>
  <p class="lead">${a.lead}</p>
  <div class="byline"><span class="av" aria-hidden="true">${MARK}</span><p>By <b>Framefly</b>. ${a.disclosure ?? "We make a tool that films demo videos, so we have a side in this. Where we quote a number, the source is at the end."}</p></div>
  <p class="article-meta"><time datetime="${a.date}">${longDate(a.date)}</time>${a.updated !== a.date ? `<span>Updated <time datetime="${a.updated}">${longDate(a.updated)}</time></span>` : ""}<span>${a.minutes} min read</span></p>
${a.body}
  <div class="endcta card" data-when-waiting>
    <p><b>Framefly films your app for you.</b> Give it a demo account and a brief; it writes the video, shows you the plan, then films it. It launches on <span data-launch-date>October 28</span>, and a few apps are being filmed before that.</p>
    <a class="btn btn-primary" href="beta.html">Apply for the beta</a>
  </div>
  <div class="endcta card" data-when-live hidden>
    <p><b>Framefly films your app for you.</b> Give it a demo account and a brief; it writes the video, shows you the plan, then films it. The first video is free.</p>
    <a class="btn btn-primary" data-app-link href="https://app.framefly.app">Make your first video</a>
  </div>
</article>
<aside class="rail">
  <p class="rail-t">On this page</p>
  <nav class="rail-toc" aria-label="On this page">${toc.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join("")}</nav>
  ${others.length ? `<p class="rail-t">More articles</p><nav class="rail-more">${others.map((o) => `<a href="articles/${o.slug}">${esc(o.title)}</a>`).join("")}</nav>` : ""}
</aside>
</div>`;
  const article = ld({ "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.description, datePublished: a.date, dateModified: a.updated, inLanguage: "en", mainEntityOfPage: a.url, image: `${SITE}/assets/img/og.png`, author: { "@type": "Organization", name: "Framefly", url: SITE }, publisher: org });
  page({ file: `articles/${a.slug}.html`, kind: "article", meta: { ...a, url: a.url, priority: "0.7", ld: article + crumbs([["Framefly", `${SITE}/`], ["Articles", `${SITE}/articles/`], [a.title, a.url]]) }, body });
}
page({
  file: "articles/index.html",
  meta: { title: "Framefly articles: demo videos, launch videos and how to make them", description: "Practical articles on making demo videos and launch videos for software: what works, what it costs, how long it should be, with sources.", priority: "0.8", updated: articles[0]?.updated, ld: crumbs([["Framefly", `${SITE}/`], ["Articles", `${SITE}/articles/`]]) },
  body: `<section class="page-head"><div class="aurora" aria-hidden="true"></div><div class="wrap"><h1>Articles</h1><p class="lead">How to make a demo video or a launch video for software: what works, how long it should be, what it costs. Every number comes with its source.</p></div></section>
<section class="section flush-top"><div class="wrap">{{block:articles}}</div></section>
{{block:closing}}`,
});

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

// ── for search engines ──
writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((p) => `  <url><loc>${p.url}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}<priority>${p.priority}</priority></url>`).join("\n")}\n</urlset>\n`);
const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
writeFileSync(
  join(root, "articles", "feed.xml"),
  `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>Framefly articles</title>\n  <subtitle>Demo videos and launch videos for software, and how to make them.</subtitle>\n  <link href="${SITE}/articles/feed.xml" rel="self"/>\n  <link href="${SITE}/articles/"/>\n  <id>${SITE}/articles/</id>\n  <updated>${articles[0]?.updated ?? "2026-10-09"}T08:00:00Z</updated>\n  <author><name>Framefly</name></author>\n${articles.map((a) => `  <entry>\n    <title>${xml(a.title)}</title>\n    <link href="${a.url}"/>\n    <id>${a.url}</id>\n    <published>${a.date}T08:00:00Z</published>\n    <updated>${a.updated}T08:00:00Z</updated>\n    <summary>${xml(a.description)}</summary>\n  </entry>`).join("\n")}\n</feed>\n`,
);

// ── for AI assistants: llms.txt (a map of the site) and llms-full.txt (the articles in full, as text) ──
const llms = read(join(src, "llms.md")).replace("{{articles}}", articles.map((a) => `- [${a.title}](${a.url}): ${a.description}`).join("\n"));
writeFileSync(join(root, "llms.txt"), llms);
/** An article as Markdown: headings, paragraphs, lists, tables and links, nothing else. */
const md = (html) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, h, t) => `[${plain(t)}](${h.startsWith("http") ? h : `${SITE}/${h.replace(/^(\.\.\/)+/, "")}`})`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (_, t) => `\n\n## ${plain(t)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (_, t) => `\n\n### ${plain(t)}\n\n`)
    .replace(/<summary>([\s\S]*?)<\/summary>/g, (_, t) => `\n\n**${plain(t)}** `)
    .replace(/<tr[^>]*>([\s\S]*?)<\/tr>/g, (_, r) => "\n| " + [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" | ") + " |")
    .replace(/<li[^>]*>/g, "\n- ")
    .replace(/<\/(p|div|ul|ol|table|details|figure|figcaption)>/g, "\n\n")
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "**$2**")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
writeFileSync(join(root, "llms-full.txt"), `${llms.trim()}\n\n---\n\n# Articles in full\n\n${articles.map((a) => `# ${a.title}\n\nURL: ${a.url}\nPublished: ${a.date}${a.updated !== a.date ? `, updated ${a.updated}` : ""}\n\n${a.lead.replace(/<[^>]+>/g, "")}\n\n${md(a.body)}`).join("\n\n---\n\n")}\n`);

console.log("done:", pages.length, "pages,", articles.length, "articles");
