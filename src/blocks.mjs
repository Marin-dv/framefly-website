// The parts of a page that are made from src/data.mjs. A page asks for one with {{block:name}}.
// Each returns plain HTML; the interactive ones are brought to life by assets/js/site.js and stage.js.

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** A film in its player. The file is only fetched when the player comes on screen. */
function player({ icon, esc }, t, { autoplay = false } = {}) {
  const f = t.film;
  return `<div class="player" data-player data-film="${t.id}" data-sound="${f.sound}"${autoplay ? " data-autoplay" : ""} style="--ar:${f.w} / ${f.h}">
  <div class="player-screen">
    <video playsinline muted loop preload="none" poster="assets/films/${t.id}.webp" width="${f.w}" height="${f.h}" aria-label="${esc(`${t.name}: a film of Instagram Feed made by Framefly`)}"></video>
    <button class="player-big" type="button" data-play aria-label="Play">${icon("play-fill")}</button>
  </div>
  <div class="player-bar">
    <button class="icon-btn" type="button" data-play aria-label="Play">${icon("play-fill")}${icon("pause-fill")}</button>
    <div class="player-track" data-track role="slider" tabindex="0" aria-label="Position in the film" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
    <span class="player-time" data-time>0:00 / ${clock(f.seconds)}</span>
    <span class="player-note" data-note>${f.full ? "" : `Opening of a ${clock(f.filmSeconds)} film`}</span>
    <button class="icon-btn" type="button" data-sound-btn aria-label="Turn the sound on"${f.sound ? "" : " hidden"}>${icon("speaker-high")}${icon("speaker-slash")}</button>
    <button class="icon-btn" type="button" data-full aria-label="Full screen">${icon("corners-out")}</button>
  </div>
</div>`;
}

/** The launch-day email form. Each one on a page needs its own id. */
function notify({ icon }, id, label, sr = false, help = true) {
  return `<div data-when-waiting style="width:100%;max-width:440px">
  <form class="capture" data-form="notify" data-done="${id}-done">
    <label class="field-label${sr ? " sr-only" : ""}" for="${id}-email">${label}</label>
    <div class="capture-row" data-well="email">
      ${icon("envelope-simple")}
      <input id="${id}-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@yourapp.com" data-required="email" data-msg="Add your email so we can tell you when it's live.">
      <button class="btn btn-primary" type="submit">Notify me</button>
    </div>
    <p class="error-text" data-err="email" hidden>${icon("warning")}<span></span></p>
    <p class="error-text" data-form-error hidden>${icon("warning")}<span>That didn't go through. Check your connection and try again.</span></p>
    ${help ? '<p class="help">One email when Framefly launches. No newsletter.</p>' : ""}
    <div aria-hidden="true" style="position:absolute;left:-9999px"><input name="company" tabindex="-1" autocomplete="off"></div>
  </form>
  <div class="done" id="${id}-done" hidden tabindex="-1" role="status">${icon("check-circle")}<p><b>You're on the list.</b> One email to <span data-echo-email></span> on launch day, and nothing before.</p></div>
</div>
<div data-when-live hidden>
  <a class="btn btn-primary btn-lg" data-app-link href="https://app.framefly.app">Make your first video<span class="nub">${icon("arrow-up-right")}</span></a>
</div>`;
}

export const blocks = {
  vanssay: ({ data, icon }) => `<div class="products">${data.vanssay.map((p) => `<a class="product" href="${p.href}" target="_blank" rel="noopener">${icon(p.icon)}<b>${p.name}</b><span>${p.line}</span></a>`).join("")}</div>`,

  "notify-hero": (c) => notify(c, "hero", "Get one email on launch day", false, false),

  /** Prompt in, video out: the brief the app keeps with each film, then the film. */
  "hero-film": (c) => {
    const { data, icon, esc } = c;
    const first = data.templates[0];
    return `<div class="inout" data-inout>
  <div class="brief card">
    <div class="brief-top"><span class="brief-label">${icon("magic-wand")}Video brief</span><span class="brief-app"><i class="glyph">I</i>Instagram Feed</span></div>
    <p class="brief-text" data-brief>${esc(first.brief)}</p>
    <div class="brief-pills" role="radiogroup" aria-label="Template">
      ${data.templates.map((t, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-template="${t.id}">${t.name}</button>`).join("")}
    </div>
  </div>
  <div class="flight" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="viewfinder"><span class="vf" aria-hidden="true"></span>${player(c, first, { autoplay: true })}</div>
</div>`;
  },

  /** The catalogue: each template with the film made in it. */
  templates: (c) => {
    const { data, icon, esc } = c;
    const row = (t) => `<article class="tpl" id="${t.id}">
  <div>${player(c, t)}</div>
  <div class="tpl-body">
    <span class="chip chip-accent">${t.kind === "Launch" ? "Launch film" : "Demo"}</span>
    <h3>${t.name}</h3>
    <p>${esc(t.description)}</p>
    <dl class="facts">${Object.entries(t.facts).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}<div><dt>This film</dt><dd>${clock(t.film.filmSeconds)}, 1080p</dd></div></dl>
    <details><summary>${icon("caret-right")}The brief it came from</summary><p>${esc(t.brief)}</p></details>
  </div>
</article>`;
    const group = (kind, title, lead) => `<div class="head" style="margin-bottom:8px"><h2>${title}</h2><p class="lead">${lead}</p></div>${data.templates.filter((t) => t.kind === kind).map(row).join("")}`;
    return `${group("Launch", "Launch films", "A launch film argues. It leads with what your product gives back in time or money, and shows the app for a few seconds, as proof.")}
<div style="height:clamp(48px,7vw,96px)"></div>
${group("Demo", "Demos", "A demo shows. Framefly walks through your app click by click, with the camera on whatever just changed.")}`;
  },

  /** The plan's picture, small: backdrop, your app's window, captions and a presenter, each moved by hand. */
  stage: ({ data, icon }) => `<div class="canvas" data-stage>
  <div>
    <div class="canvas-view"><div class="frame" data-frame><noscript><p style="padding:24px;color:#fff">This picture is interactive. It needs JavaScript.</p></noscript></div></div>
    <div class="canvas-foot">
      <div class="seg" role="radiogroup" aria-label="Shape of the video">${Object.keys(data.layout.ratio).map((f, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-format="${f}">${f}</button>`).join("")}</div>
      <p>Drag the window, the caption or the presenter. <button type="button" class="link" data-reset>Put everything back</button></p>
    </div>
  </div>
  <div class="canvas-panel card">
    <div class="canvas-tabs" role="tablist" aria-label="Settings">
      <button type="button" role="tab" aria-selected="true" data-tab="look">${icon("palette")}Look</button>
      <button type="button" role="tab" aria-selected="false" data-tab="captions">${icon("closed-captioning")}Captions</button>
      <button type="button" role="tab" aria-selected="false" data-tab="presenter">${icon("user-focus")}Presenter</button>
    </div>
    <div class="canvas-pane" data-pane="look">
      <div class="pane-label">Backdrop <span data-bg-name>Dusk</span></div>
      <div class="swatches" role="radiogroup" aria-label="Backdrop">${data.backgrounds.map((b, i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="${b.name}" title="${b.name}" data-bg="${b.id}" style="background:${b.css ? b.css : `center / cover url(assets/library/backgrounds/${b.img}.thumb.jpg)`}"></button>`).join("")}</div>
      <p class="pane-note">Five are drawn by the templates. Thirteen are pictures made for Framefly. You can also upload your own.</p>
    </div>
    <div class="canvas-pane" data-pane="captions" hidden>
      <div class="pane-label">Style <span data-cap-name>Karaoke</span></div>
      <div class="caplist" role="radiogroup" aria-label="Caption style"><button type="button" role="radio" aria-checked="false" data-cap="none">Off</button>${data.captions.map((s) => `<button type="button" role="radio" aria-checked="${s.id === "karaoke"}" data-cap="${s.id}">${s.name}</button>`).join("")}</div>
      <div class="pane-label">Colour of the spoken word</div>
      <div class="dots" role="radiogroup" aria-label="Colour of the spoken word">${data.captionAccents.map((a, i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="${a}" data-accent="${a}" style="background:${a}"></button>`).join("")}</div>
      <p class="pane-note">Captions are the script, word for word, timed on the voice.</p>
    </div>
    <div class="canvas-pane" data-pane="presenter" hidden>
      <div class="pane-label">Who <span data-who-name>Nobody</span></div>
      <div class="faces" role="radiogroup" aria-label="Presenter"><button type="button" role="radio" aria-checked="true" aria-label="Nobody" data-who="">${icon("prohibit")}</button>${data.presenters.map((p) => `<button type="button" role="radio" aria-checked="false" aria-label="${p.name}" title="${p.name}: ${p.tone}" data-who="${p.id}"><img src="assets/library/presenters/${p.id}.face.jpg" alt="" loading="lazy" width="96" height="96"></button>`).join("")}</div>
      <div data-who-options hidden style="display:grid;gap:14px">
        <div class="seg" role="radiogroup" aria-label="How they appear" style="justify-self:start"><button type="button" role="radio" aria-checked="true" data-mode="corner">Over the app</button><button type="button" role="radio" aria-checked="false" data-mode="full">Full screen</button></div>
        <div data-rooms hidden style="display:grid;gap:10px">
          <div class="pane-label">Room <span data-room-name></span></div>
          <div class="rooms" role="radiogroup" aria-label="Room">${data.scenes.map((s) => `<button type="button" role="radio" aria-checked="false" aria-label="${s.name}" title="${s.name}" data-room="${s.id}" style="background-image:url(assets/library/scenes/${s.id}.thumb.jpg)"></button>`).join("")}</div>
        </div>
      </div>
      <p class="pane-note">Presenters are generated: nobody here exists. An "AI presenter" label shows whenever one is on screen, and it cannot be removed.</p>
    </div>
  </div>
</div>`,

  /** Twenty caption styles, each saying the sentence typed above them. */
  captions: ({ data }) => `<div class="capbar">
  <label class="sr-only" for="cap-words">Your own words</label>
  <input class="control" id="cap-words" type="text" value="Your feed, live on your own site" maxlength="60" data-cap-words>
  <div class="seg" role="radiogroup" aria-label="Family"><button type="button" role="radio" aria-checked="true" data-family="">All 20</button>${["Social", "Classic", "Clean"].map((f) => `<button type="button" role="radio" aria-checked="false" data-family="${f}">${f} ${data.captions.filter((s) => s.family === f).length}</button>`).join("")}</div>
</div>
<div class="capgrid" data-capgrid>${data.captions.map((s) => `<div class="captile" data-family="${s.family}"><div class="captile-view"><div class="cap" data-cap-demo="${s.id}"></div></div><div class="captile-body"><b>${s.name}</b><span>${s.desc}</span></div></div>`).join("")}</div>`,

  /** Any presenter in any room: they are cut out, so one is laid over the other. */
  cast: ({ data }) => {
    const p0 = data.presenters[0];
    return `<div class="cast" data-cast>
  <div class="cast-view"><img class="room" data-cast-room src="assets/library/scenes/${p0.scene}.jpg" alt="" loading="lazy" width="1600" height="900"><img class="who" data-cast-who src="assets/library/presenters/${p0.id}.webp" alt="${p0.name}, a generated presenter" loading="lazy"><span class="frame-ai" style="font-size:12px;padding:4px 11px">AI presenter</span></div>
  <div class="cast-panel card">
    <div class="cast-who"><b data-cast-name>${p0.name}</b><span data-cast-tone>${p0.tone}</span></div>
    <div class="faces" role="radiogroup" aria-label="Presenter">${data.presenters.map((p, i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="${p.name}" title="${p.name}: ${p.tone}" data-cast-pick="${p.id}"><img src="assets/library/presenters/${p.id}.face.jpg" alt="" loading="lazy" width="96" height="96"></button>`).join("")}</div>
    <div class="pane-label">Room <span data-cast-roomname>${data.scenes.find((s) => s.id === p0.scene).name}</span></div>
    <div class="rooms" role="radiogroup" aria-label="Room">${data.scenes.map((s) => `<button type="button" role="radio" aria-checked="${s.id === p0.scene}" aria-label="${s.name}" title="${s.name}" data-cast-scene="${s.id}" style="background-image:url(assets/library/scenes/${s.id}.thumb.jpg)"></button>`).join("")}</div>
    <p class="pane-note">Nine presenters and ten rooms, all generated for Framefly. A presenter adds one credit to a video and is in beta.</p>
  </div>
</div>`;
  },

  voices: ({ data }) => `<div class="voices">${data.voices.map((v) => `<div class="voice card"><b>${v.name}</b><span>${v.who}</span><em>${v.tones}. ${v.best}.</em></div>`).join("")}</div>
<div class="langs">${data.languages.map((l) => `<span class="chip chip-line">${l}</span>`).join("")}</div>`,

  backdrops: ({ data }) => `<div class="backdrops">${data.backgrounds.map((b) => `<div class="backdrop"><i style="background:${b.css ? b.css : `center / cover url(assets/library/backgrounds/${b.img}.thumb.jpg)`}"></i>${b.name}</div>`).join("")}</div>`,

  /** The four plans. The buttons follow the launch: an email before it, the app after. */
  plans: ({ data, icon }) => `<div class="plans" data-plans>${data.plans
    .map((p) => {
      const price = p.id === "launch" ? `<b data-pack-price>$29</b><span data-pack-unit>for 1 video</span>` : `<b${p.yearly !== p.price ? ` data-monthly="${p.price}" data-yearly="${p.yearly}"` : ""}>$${p.price}</b><span>${p.unit}</span>`;
      const extra = p.id === "launch" ? `<div class="seg" role="radiogroup" aria-label="Pack size">${data.packs.map((k, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-pack="${k.credits}" data-price="${k.price}">${k.credits}</button>`).join("")}</div>` : "";
      return `<article class="plan card${p.highlight ? " featured" : ""}">
  <div class="plan-top"><h3>${p.name}</h3>${p.highlight ? '<span class="chip chip-accent">Most chosen</span>' : ""}</div>
  <div class="plan-price">${price}</div>
  ${extra}
  <p class="plan-blurb">${p.blurb}</p>
  <ul>${p.features.map((f) => `<li>${icon("check-bold")}<span>${f}</span></li>`).join("")}</ul>
  <a class="btn ${p.highlight ? "btn-primary" : "btn-secondary"}" href="#notify" data-when-waiting>Notify me</a>
  <a class="btn ${p.highlight ? "btn-primary" : "btn-secondary"}" href="https://app.framefly.app" data-when-live data-app-link hidden>${p.id === "trial" ? "Start free" : p.id === "launch" ? "Buy a pack" : `Choose ${p.name}`}</a>
</article>`;
    })
    .join("")}</div>`,

  compare: ({ data, icon }) => `<div class="table-scroll"><table>
  <thead><tr><th scope="col"><span class="sr-only">Feature</span></th>${data.plans.map((p) => `<th scope="col">${p.name}</th>`).join("")}</tr></thead>
  <tbody>${data.compare.map(([k, cells]) => `<tr><th scope="row">${k}</th>${cells.map((v) => (v === "yes" ? `<td>${icon("check-bold")}<span class="sr-only">Included</span></td>` : v ? `<td>${v}</td>` : `<td class="none"><span class="sr-only">Not included</span></td>`)).join("")}</tr>`).join("")}</tbody>
</table></div>`,

  subprocessors: ({ data }) => `<div class="table-scroll"><table>
  <thead><tr><th scope="col">Service</th><th scope="col">What for</th><th scope="col">Where</th></tr></thead>
  <tbody>${data.subprocessors.map(([a, b, c]) => `<tr><th scope="row">${a}</th><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
</table></div>`,

  /** Every article, newest first. */
  articles: ({ articles, longDate, esc }) => (articles.length ? `<div class="artlist">${articles.map((a) => `<a class="artcard card" href="articles/${a.slug}"><span class="chip chip-line">${esc(a.category ?? "Guide")}</span><h2>${esc(a.title)}</h2><p>${esc(a.description)}</p><span class="artcard-meta"><time datetime="${a.date}">${longDate(a.date)}</time><span>${a.minutes} min read</span></span></a>`).join("")}</div>` : '<p class="muted">The first articles are being written.</p>'),
  /** The three latest, for the home page. */
  "articles-latest": ({ articles, longDate, esc }) => `<div class="artlist three">${articles.slice(0, 3).map((a) => `<a class="artcard card" href="articles/${a.slug}"><span class="chip chip-line">${esc(a.category ?? "Guide")}</span><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><span class="artcard-meta"><time datetime="${a.date}">${longDate(a.date)}</time><span>${a.minutes} min read</span></span></a>`).join("")}</div>`,


  /** Three films as cards on a night band: the film plays when it is on screen. */
  "home-templates": ({ data, esc }) => `<div class="rx-tpl reveal" data-rx-films>${["launch-continuous", "studio", "dynamic-demo"].map((id) => data.templates.find((t) => t.id === id)).map((t) => `<article class="rx-card"><div class="rx-frame"><video src="assets/films/${t.id}.preview.mp4" poster="assets/films/${t.id}.small.webp" muted loop playsinline preload="none" aria-label="Excerpt of the ${esc(t.name)} template"></video></div><h3>${t.name}<small>${esc(t.line)}</small></h3><div class="rx-facts">${Object.entries(t.facts).map(([k, v]) => `<div><span>${k}</span>${esc(v.replace(", scored to the cut", ""))}</div>`).join("")}</div></article>`).join("")}</div>`,

  /** The three latest articles as rows. */
  "reads-latest": ({ articles, icon, esc }) => `<div class="rx-reads reveal">${articles.slice(0, 3).map((a) => `<a href="articles/${a.slug}"><span class="rx-slate">${esc(a.category ?? "Guide")}</span><h3>${esc(a.title)}</h3>${icon("arrow-up-right")}</a>`).join("")}</div>`,

  /** The last section of most pages: the countdown, and the one email. */
  closing: (c) => `<section class="closing night closing-band" id="launch">
  <div class="wrap closing" style="padding-block:0">
    <div data-when-waiting style="display:grid;gap:22px;justify-items:center">
      <span class="rec"><i></i>Launch day in</span>
      <div class="timecode" role="timer" aria-live="off"><div><b data-cd="d">00</b><span>Days</span></div><i>:</i><div><b data-cd="h">00</b><span>Hours</span></div><i>:</i><div><b data-cd="m">00</b><span>Min</span></div><i>:</i><div><b data-cd="s">00</b><span>Sec</span></div></div>
      <p class="sr-only" data-cd-sr></p>
    </div>
    <h2 data-when-waiting>Your app, on film, on <span data-launch-date>October 28</span>.</h2>
    <h2 data-when-live hidden>Framefly is live.</h2>
    <p class="lead" data-when-waiting>Leave your email and you get one message on launch day, with a link to make your first video for free.</p>
    <p class="lead" data-when-live hidden>Your first video is free, and no card is needed.</p>
    <div id="notify" style="display:grid;justify-items:center;width:100%;text-align:left">${notify(c, "end", "Your email", true)}</div>
  </div>
</section>`,
};
