// Photographs the real app for the site: every screen the pages show, in both themes, at 2x.
// The pictures are the product's own interface, never a drawing of it.
//
//   1. Build the app:      cd ../Framefly.app/app && npx vite build --outDir <some folder> --emptyOutDir
//   2. Serve that folder:  node tools/serve.mjs <some folder> 5310
//   3. Shoot:              node tools/shots.mjs http://127.0.0.1:5310/index.html
//
// It drives the app the way a person would (writes a brief, plans a video, generates it, points at a
// finished one), so the screens are real states, and it never touches a dev server you have open.
// Playwright and its browser come from the lab (../Framefly.app/research/lab). FFmpeg makes the WebP files.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lab = join(root, "..", "Framefly.app", "research", "lab");
const { chromium } = createRequire(join(lab, "package.json"))("playwright-core");

const BASE = process.argv[2] ?? "http://127.0.0.1:5310/index.html";
const only = process.argv[3]; // "light" or "dark" to shoot one theme
const W = 1440, H = 810;
const raw = join(tmpdir(), "framefly-shots");
rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });
const out = join(root, "assets", "app");
mkdirSync(out, { recursive: true });

// the browser Playwright installed for the lab, wherever it is on this machine
function chrome() {
  if (process.env.FRAMEFLY_CHROME) return process.env.FRAMEFLY_CHROME;
  const home = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright");
  if (home && existsSync(home)) {
    const dirs = readdirSync(home).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
    for (const d of dirs) {
      const exe = join(home, d, "chrome-win64", "chrome.exe");
      if (existsSync(exe)) return exe;
      const old = join(home, d, "chrome-win", "chrome.exe");
      if (existsSync(old)) return old;
    }
  }
  return undefined; // let Playwright look
}

const BRIEF = "A 45-second demo of Instagram Feed for people who built their own website. Open on the finished feed, then show Add a feed, Layouts and the Embed code. Friendly and calm. End on Start free.";
const NOTE = "Hold on the three posts a little longer";

const browser = await chromium.launch({ executablePath: chrome(), headless: true });

for (const theme of ["light", "dark"].filter((t) => !only || t === only)) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: "no-preference" });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("framefly.themePref", t);
      localStorage.setItem("framefly.theme", t);
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

  const shot = async (name) => {
    // the pointer out of the way, tooltips gone
    await page.mouse.move(W - 2, H - 2);
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(raw, `${name}.${theme}.png`) });
    console.log(theme, name);
  };
  const go = async (route, wait = 1500) => {
    await page.goto(`${BASE}#${route}`, { waitUntil: "load" });
    await page.waitForTimeout(wait);
  };
  const step = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      console.log(`! ${theme} ${name}: ${String(e).split("\n")[0].slice(0, 200)}`);
    }
  };

  // ── the pages inside the shell ──
  for (const [name, route] of [["home", "/"], ["templates", "/templates"], ["presenters", "/presenters"], ["voices", "/voices"], ["brand", "/brand"], ["guardrails", "/guardrails"], ["security", "/security"], ["connect", "/apps/new"], ["app", "/apps/instagram"]]) {
    await step(name, async () => {
      await go(route);
      await shot(name);
    });
  }
  await step("app-access", async () => {
    await page.getByRole("tab", { name: "Access" }).click();
    await page.waitForTimeout(700);
    await shot("app-access");
  });

  // ── a finished video, and something pointed out on it ──
  await step("video", async () => {
    await go("/projects/instagram-launch-continuous", 2200);
    await shot("video");
  });
  await step("video-point", async () => {
    await page.getByRole("button", { name: /Point for Framefly/ }).click();
    await page.waitForTimeout(400);
    const box = await page.locator("video").first().boundingBox();
    await page.mouse.click(box.x + box.width * 0.27, box.y + box.height * 0.36);
    await page.waitForTimeout(600);
    await page.keyboard.type(NOTE, { delay: 6 });
    await page.waitForTimeout(600);
    await shot("video-point");
  });

  // ── the brief ──
  await step("studio", async () => {
    await go("/studio", 1200);
    const ta = page.locator("textarea").first();
    await ta.click();
    await ta.pressSequentially(BRIEF, { delay: 1 });
    await page.waitForTimeout(900);
    await shot("studio");
  });

  // ── the plan's window ──
  await step("plan", async () => {
    await page.getByRole("button", { name: /Plan my video/ }).click();
    await page.waitForURL(/#\/plan\//, { timeout: 30000 });
    await page.waitForTimeout(2400);
    await shot("plan");
  });
  await step("plan-captions", async () => {
    await page.getByRole("tab", { name: "Captions" }).click();
    await page.waitForTimeout(400);
    // another style than the template's, to show the picture change
    await page.getByRole("region", { name: "Settings" }).getByText("Blocks", { exact: true }).click();
    await page.waitForTimeout(600);
    await shot("plan-captions");
  });
  await step("plan-presenter", async () => {
    await page.getByRole("tab", { name: "Presenter" }).click();
    await page.waitForTimeout(300);
    await page.getByRole("radiogroup", { name: "Presenter", exact: true }).getByRole("radio").nth(1).click();
    await page.waitForTimeout(900);
    await shot("plan-presenter");
    await page.getByRole("radio", { name: "Over the app" }).or(page.getByRole("button", { name: "Over the app" })).first().click();
    await page.waitForTimeout(700);
    await shot("plan-presenter-corner");
    // back to no presenter: the trial's one credit makes a video without one
    await page.getByRole("button", { name: "Change", exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole("radiogroup", { name: "Presenter", exact: true }).getByRole("radio").first().click();
    await page.waitForTimeout(500);
  });

  // ── the same window, making the video ──
  await step("generating", async () => {
    await page.getByRole("tab", { name: "Look" }).click();
    await page.getByRole("button", { name: /^Generate/ }).click();
    // the voice comes first; then the first section is filmed
    await page.waitForTimeout(8200);
    await page.screenshot({ path: join(raw, `generating.${theme}.png`) });
    console.log(theme, "generating");
  });

  if (errors.length) console.log(`${theme} page errors:\n  ` + [...new Set(errors)].join("\n  "));
  await ctx.close();
}
await browser.close();

// ── PNG to WebP: the full picture for desktops, half of it for phones ──
for (const f of readdirSync(raw).filter((f) => f.endsWith(".png"))) {
  const name = f.replace(/\.png$/, "");
  for (const [suffix, width, q] of [["", 2400, 84], [".sm", 1200, 80]]) {
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", join(raw, f), "-vf", `scale=${width}:-2:flags=lanczos`, "-c:v", "libwebp", "-quality", String(q), "-compression_level", "6", join(out, `${name}${suffix}.webp`)], { stdio: "inherit" });
    if (r.status !== 0) console.log("! could not convert", f);
  }
}
console.log("done ->", out);
