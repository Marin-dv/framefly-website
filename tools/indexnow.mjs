// Tells Bing and the other IndexNow search engines which pages changed, right after a push.
// (Google does not use IndexNow: it reads sitemap.xml, which you give it once in Search Console.)
//
//   node tools/indexnow.mjs            every page of the sitemap
//   node tools/indexnow.mjs <url> ...  only these
//
// The key is public by design: it is the file 9eea61217da60f01d5166f1ae98635c9.txt at the root of the site,
// which proves the request comes from whoever runs framefly.app.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const key = "9eea61217da60f01d5166f1ae98635c9";
const urlList = process.argv.length > 2 ? process.argv.slice(2) : [...readFileSync(join(root, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: "framefly.app", key, keyLocation: `https://framefly.app/${key}.txt`, urlList }),
});
console.log(res.status, res.status === 200 || res.status === 202 ? `accepted: ${urlList.length} addresses` : await res.text());
