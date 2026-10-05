# framefly.app

The launch site for Framefly (the demo-video product in `../Framefly.app/`). Static HTML, CSS and vanilla JS: no build step, no framework, no third-party requests. Deploy it the same way as vanssay.net, by pushing to GitHub Pages (`CNAME` is already `framefly.app`).

## Pages

| File | Page |
|---|---|
| `index.html` | Home: the slate countdown, the trailer, how it works, capabilities, styles, guardrails, pricing, beta, FAQ |
| `product.html` | The tour, one chapter per production stage, with real screenshots of the app |
| `styles.html` | The 12 styles with live previews, category filters, and the style mixer |
| `pricing.html` | Plans, a monthly/yearly toggle, a spend calculator, the comparison table |
| `security.html` | Secrets, guardrails, retention, AI Act labeling, sub-processors |
| `beta.html` | The beta application form |
| `log.html` | The production log (build in public) |
| `about.html` | The maker and the other Vanssay products |
| `privacy.html`, `terms.html` | Privacy policy, terms and legal notice for the pre-launch site |
| `404.html` | GitHub Pages serves it for any unknown URL |

## The two settings that matter

Everything lives in `assets/js/config.js`:

- **`launchAt`**: the launch moment in UTC. Every countdown, date and "launch day" label reads it. To postpone, change this one line. When the countdown reaches zero, the site switches to its live state on its own: the slate claps shut, the capture forms are replaced by a "Make your first video" button pointing at `appUrl`.
- **`formEndpoint`**: where the "Notify me" and beta forms send their data. **It is empty right now.** While it's empty, the forms show their success state and log the payload to the console on local previews; on framefly.app they open a pre-filled email to `contactEmail` instead, so no signup is lost. Wire it before launch.

The forms `POST` JSON with `Content-Type: application/json`:

```json
{ "type": "notify", "page": "/index.html", "sentAt": "2026-09-28T10:10:21.730Z", "email": "you@yourapp.com" }
```

```json
{ "type": "beta", "page": "/beta.html", "sentAt": "...", "email": "...", "name": "...", "app_url": "app.tallyhq.com",
  "runtime": "web", "videos": ["launch", "product-hunt"], "ship": "month", "demo_account": "ready", "note": "..." }
```

Any 2xx answer counts as success; anything else shows the inline "That didn't go through" error with the data kept in the form. The endpoint must allow CORS from `https://framefly.app`. A `company` field is a hidden honeypot: submissions that fill it are dropped in the browser.

`preorderUrl` (a Stripe Payment Link) shows the $29 pre-order card on the pricing page when set.

## Shared blocks

The head tags, nav, footer and scripts are identical on every page. Edit them in `partials/`, then run:

```bash
node tools/stamp.mjs
```

It rewrites the blocks between `<!-- @name -->` and `<!-- /@name -->` in every page, marks the current page in the nav, and expands `{{i:icon-name}}` and `{{mark}}` shorthand if you use it in new markup. The output is plain static HTML, so the site still works if you never run it again.

## Assets

- `assets/css/site.css`: the design system, built on the app's own tokens (`Framefly.app/app/src/styles/tokens.css`). Dark only, on purpose.
- `assets/css/fonts.css`: Geist and Geist Mono, embedded (OFL). No Google Fonts request, which keeps the "no third-party requests" line in the privacy policy true.
- `assets/js/vendor/gsap.min.js`: GSAP 3.12.5, self-hosted for the same reason. Only the home page loads it (the trailer).
- `assets/img/icons.svg`: Phosphor icons (MIT), extracted from the app's `@phosphor-icons/react` package, so the site uses the same glyphs as the product.
- `assets/img/app/*.webp`: 2x screenshots of the real app. To refresh them after the UI changes, serve `Framefly.app/app/dist` and re-shoot at `deviceScaleFactor: 2`.
- `assets/img/og.png`: the social card, rendered from `tools/og-render.html`. Re-render it with any headless browser at 1200x630 if the date changes.

## The trailer

`assets/js/trailer.js` plays a 35-second composition on a fixed 1280x720 stage that is scaled to fit, the way a render works. GSAP moves things; text, typing, classes and the karaoke captions are computed from the playhead time, so seeking and looping always land on the right frame. It autoplays only while on screen, pauses when the tab is hidden, and rests on the storyboard frame when the visitor prefers reduced motion. On phones the captions are mirrored below the stage at a readable size.
