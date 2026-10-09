# framefly.app

The launch site for Framefly (the demo-video product in `../Framefly.app/`). Plain HTML, CSS and vanilla JS at the root, served by GitHub Pages (`CNAME` is `framefly.app`). No framework and no third-party request: fonts, icons, films and code all come from this repo.

Everything the site shows is the app's own: its design tokens and typefaces, real screenshots of its screens, the films its pipeline rendered, its picture library, its prices.

## Edit, build, deploy

Pages are written in `src/` and built to the root:

```bash
node tools/build.mjs        # after any change in src/
node tools/serve.mjs . 4321 # look at it on http://127.0.0.1:4321
git push                    # deploy
```

The built files are committed, so GitHub Pages needs no build step.

| Path | What it is |
|---|---|
| `src/pages/*.html` | One file per page: its own HTML, with title and description in a comment at the top |
| `src/partials/` | The nav and the footer, shared by every page |
| `src/data.mjs` | Templates, captions, backdrops, presenters, voices, plans, prices. A copy of the app's data (`Framefly.app/app/src/data`): change it here when the app changes |
| `src/blocks.mjs` | The parts of a page made from that data (film players, the canvas, plan cards...) |
| `assets/css/site.css` | The design system, on the app's tokens. Light and dark are both first-class |
| `assets/js/site.js` | Theme, countdown, forms, film players |
| `assets/js/stage.js` | The interactive canvas, the caption library and the presenter rooms: small copies of the app's own components |
| `assets/js/config.js` | **The launch date and the form wiring** (below) |

In a page, `{{icon:name}}` is a Phosphor icon, `{{shot:name|what it shows}}` a screenshot of the app in both themes, `{{block:name}}` a block from `src/blocks.mjs`. The build also writes `assets/js/data.js`, `assets/img/icons.svg` (only the icons used, read from the app's Phosphor package) and `sitemap.xml`.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: the brief and the film it became, how a video is made, the live canvas, capture measurements, guardrails, pricing, beta, FAQ |
| `product.html` | The tour: connect, brief, plan, generate, watch, revise, stay fresh, with real screens |
| `templates.html` | The five templates with their films, the 20 caption styles, presenters and rooms, backdrops, voices |
| `pricing.html` | Plans, monthly or yearly, the estimate, what a credit covers, the comparison |
| `security.html` | Secrets, guardrails, retention, AI Act labeling, sub-processors |
| `beta.html` | The beta application form |
| `log.html` | The production log (build in public) |
| `about.html` | The maker and the other Vanssay products |
| `privacy.html`, `terms.html` | Privacy policy, terms and legal notice for the pre-launch site |
| `admin.html` | The admin: who is on the launch list, who applied for the beta. Not indexed, and it shows nothing without the password |
| `404.html` | Served by GitHub Pages for any unknown URL |
| `styles.html` | Redirects to `templates.html` (the page's old address) |

## The two settings that matter

Both are in `assets/js/config.js`:

- **`launchAt`**: the launch moment in UTC. Every countdown and date reads it. To postpone, change this one line. When it is reached the site switches on its own: the forms and the beta invitations give way to a "Make your first video" button pointing at `appUrl`.
- **`formEndpoint`**: where the "Notify me" and beta forms send their data. It points at the Framefly API (`Framefly.app/api`, live at `api.vanssay.net/framefly`), which only answers framefly.app: on a local preview the forms show their error state. If it is ever emptied, the forms fall back to a pre-filled email to `contactEmail` on framefly.app, so no signup is lost.
- **`apiBase`**: the same API, for the admin page (`admin.html`). Its password is set on the server, see `Framefly.app/api/README.md`.

The forms `POST` JSON with `Content-Type: application/json`:

```json
{ "type": "notify", "page": "/index.html", "sentAt": "2026-10-09T10:10:21.730Z", "email": "you@yourapp.com" }
```

```json
{ "type": "beta", "page": "/beta.html", "sentAt": "...", "email": "...", "name": "...", "app_url": "app.yourproduct.com",
  "runtime": "web", "videos": ["launch", "product-hunt"], "ship": "month", "demo_account": "ready", "note": "..." }
```

Any 2xx answer counts as success; anything else shows the inline error with the data kept in the form. The endpoint must allow CORS from `https://framefly.app`. A `company` field is a hidden honeypot: submissions that fill it are dropped in the browser.

`preorderUrl` (a Stripe Payment Link) shows the $29 pre-order card on the pricing page when set.

## Films

```bash
node tools/media.mjs films          # the cleared excerpts (what is in the repo now)
node tools/media.mjs films --full   # the whole films
node tools/build.mjs                # the pages read assets/films/films.json
```

`tools/media.mjs` encodes the lab's originals (`Framefly.app/research/outputs/instagram-desktop`) for the web and says why two things are held back today:

- **Excerpts, not whole films.** Every film was shot on a take that loads @nike's Instagram profile, and the research notes say a public video should use an account whose owner agreed. Each film is cut just before those posts appear. Once the films are shot again on a cleared account, or you decide the posts can be shown, run it with `--full`.
- **The demos are silent.** Their narration is an ElevenLabs voice made on a plan that does not allow commercial use. The two launch films keep their sound: their music is written by the lab's own code. Set `sound: true` on a demo once its voice is recorded again on a paid plan.

It also copies the picture library (presenters, rooms, backdrops) and the three typefaces from the app.

## Screenshots of the app

`assets/app/*.webp` are the app's real screens, in both themes, at 2x. To take them again after the interface changes:

```bash
cd ../Framefly.app/app && npx vite build --outDir /some/folder --emptyOutDir
node tools/serve.mjs /some/folder 5310
node tools/shots.mjs http://127.0.0.1:5310/index.html
```

It drives the app the way a person would (writes a brief, plans a video, generates it, points at a finished one) in a headless browser, on its own build: a dev server you have open is never touched. `assets/app/instagram-feed.webp`, the screenshot inside the canvas, is the first section of a plan the app wrote for Instagram Feed.

## Other assets

- `assets/fonts/`: Gabarito, Geist and Geist Mono (OFL), served from here. That keeps the "nothing from other companies" line of the privacy policy true.
- `assets/img/og.png`: the social card. Open `tools/og-render.html` at 1200x630 in a headless browser and take a screenshot to make it again.
- `assets/img/crispness.webp`: the capture measurement of September 25, 2026.
