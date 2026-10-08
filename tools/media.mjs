// Brings the site's films, pictures and fonts over from the app repo (../Framefly.app).
// Run it again whenever a film is rendered again or the picture library changes:
//
//   node tools/media.mjs              films (the cleared excerpts) and the library
//   node tools/media.mjs films        only the films
//   node tools/media.mjs films --full the whole films instead of excerpts (read the note below first)
//   node tools/media.mjs library      only presenters, rooms, backdrops and fonts
//
// Then run `node tools/build.mjs`: the pages read assets/films/films.json.
// Needs FFmpeg on the PATH. Nothing here is fetched from the network.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = join(root, "..", "Framefly.app");
const lab = join(app, "research", "outputs", "instagram-desktop");
const pub = join(app, "app", "public");
const args = process.argv.slice(2);
const what = args.find((a) => !a.startsWith("--")) ?? "all";
const full = args.includes("--full");

const run = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8" });
const ff = (a) => {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + a.join(" "));
};
const probe = (f, entries, stream) => run("ffprobe", ["-v", "error", ...(stream ? ["-select_streams", stream] : []), "-show_entries", entries, "-of", "csv=p=0", f]).stdout.trim();
const mb = (f) => (statSync(f).size / 1048576).toFixed(1) + " MB";
const dir = (p) => (mkdirSync(p, { recursive: true }), p);

/*
  The five films of Instagram Feed, one per template (app/src/data/projects.ts).

  WHY EXCERPTS. Every film was shot on a take that loads @nike's Instagram profile, and
  research/RESEARCH.md (section 11.6) says a public video should use an account whose owner agreed.
  So by default the site only gets the stretch of each film before those posts appear (`clean`).
  `--full` publishes the whole films: use it once they are shot again on a cleared account
  (@letypographe_be is), or once you have decided the posts can be shown.

  `sound`. The two launch films carry music and effects written by the lab's own code
  (pipeline/launch_sound.py): ours to publish. The three demos are narrated by an ElevenLabs voice
  made on a plan that does not allow commercial use (RESEARCH.md, 10.3 and 11.6): they are published
  silent until that voice is recorded again on a paid plan. Set `sound: true` on a demo once it is.

  `poster`: a moment of the film, in seconds, shown before it plays.
*/
export const films = [
  { id: "launch-continuous", src: "continuous/continuous.mp4", sound: true, poster: 3.6, clean: [0, 13.8] },
  { id: "launch-film", src: "launch/launch.mp4", sound: true, poster: 7.4, clean: [0, 13.8] },
  { id: "mac-demo", src: "mac-demo.mp4", sound: false, poster: 3.2, clean: [0, 7.6] },
  { id: "studio", src: "studio.mp4", sound: false, poster: 3.2, clean: [0, 7.6] },
  { id: "dynamic-demo", src: "dynamic-demo.mp4", sound: false, poster: 4, clean: [0, 11.8] },
];

if (what === "all" || what === "films") {
  const out = dir(join(root, "assets", "films"));
  const meta = {};
  for (const f of films) {
    const src = join(lab, f.src);
    if (!existsSync(src)) {
      console.warn("missing", src);
      continue;
    }
    const whole = Number(probe(src, "format=duration"));
    const [from, to] = full ? [0, whole] : f.clean;
    const len = to - from;
    const cut = ["-ss", String(from), "-t", String(len), "-i", src];
    // an excerpt's sound fades out, so a loop does not click
    const audio = f.sound ? ["-c:a", "aac", "-b:a", "128k", "-ac", "2", ...(full ? [] : ["-af", `afade=t=out:st=${(len - 0.5).toFixed(2)}:d=0.5`])] : ["-an"];
    const x264 = (crf) => ["-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart"];
    // two sizes: 1080 for a desktop player, 720 for phones and slow connections
    ff([...cut, "-vf", "fps=30,scale=-2:1080:flags=lanczos", ...x264(26), ...audio, join(out, `${f.id}.1080.mp4`)]);
    ff([...cut, "-vf", "fps=30,scale=-2:720:flags=lanczos", ...x264(28), ...audio, join(out, `${f.id}.720.mp4`)]);
    // the loop on a card: short, small, always silent, always from the cleared stretch
    ff(["-ss", String(f.clean[0]), "-t", String(Math.min(8, f.clean[1] - f.clean[0])), "-i", src, "-vf", "fps=24,scale=-2:540:flags=lanczos", ...x264(31), "-an", join(out, `${f.id}.preview.mp4`)]);
    // the still shown before it plays
    ff(["-ss", String(f.poster), "-i", src, "-frames:v", "1", "-vf", "scale=-2:1080:flags=lanczos", "-c:v", "libwebp", "-quality", "82", join(out, `${f.id}.webp`)]);
    ff(["-ss", String(f.poster), "-i", src, "-frames:v", "1", "-vf", "scale=-2:540:flags=lanczos", "-c:v", "libwebp", "-quality", "78", join(out, `${f.id}.small.webp`)]);
    const [w, h] = probe(join(out, `${f.id}.1080.mp4`), "stream=width,height", "v:0").split(",").map(Number);
    meta[f.id] = { seconds: Math.round(len * 10) / 10, filmSeconds: Math.round(whole), full, sound: f.sound, w, h };
    console.log(f.id, `${meta[f.id].seconds} s of ${meta[f.id].filmSeconds}`, "1080:", mb(join(out, `${f.id}.1080.mp4`)), "720:", mb(join(out, `${f.id}.720.mp4`)), f.sound ? "with sound" : "silent");
  }
  writeFileSync(join(out, "films.json"), JSON.stringify(meta, null, 2) + "\n");
}

if (what === "all" || what === "library") {
  // the picture library, as the app has it: nobody in it exists, every picture was made for Framefly
  const lib = dir(join(root, "assets", "library"));
  for (const d of ["presenters", "scenes", "backgrounds"]) {
    cpSync(join(pub, d), join(lib, d), { recursive: true });
    console.log(d, readdirSync(join(lib, d)).length, "files");
  }
  // the app's typefaces (SIL Open Font License), served from this site
  const fonts = dir(join(root, "assets", "fonts"));
  const nm = join(app, "app", "node_modules", "@fontsource-variable");
  for (const [pkg, file] of [["gabarito", "gabarito-latin-wght-normal.woff2"], ["geist", "geist-latin-wght-normal.woff2"], ["geist-mono", "geist-mono-latin-wght-normal.woff2"]]) {
    cpSync(join(nm, pkg, "files", file), join(fonts, file));
    console.log("font", file);
  }
}
