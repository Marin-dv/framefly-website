// What the pages are made of. Every list here is a copy of the app's own data
// (../Framefly.app/app/src/data): when the app changes, change it here too and run
// `node tools/build.mjs`. Nothing below is invented for the site.

/** app/src/brand.ts */
export const brand = {
  name: "Framefly",
  tagline: "Prompt in. Demo video out.",
  domain: "framefly.app",
  url: "https://framefly.app",
  email: "support@framefly.app",
  x: "https://x.com/MarindeVanssay",
};

/**
 * The five templates the pipeline renders today (app/src/data/templates.ts), each with the film of
 * Instagram Feed made in it and the brief the app keeps with that film (app/src/data/projects.ts).
 * `film` (length, size, sound, excerpt or whole) is filled in from assets/films/films.json.
 */
export const templates = [
  {
    id: "launch-continuous",
    name: "Continuous Launch",
    kind: "Launch",
    line: "One argument, one object, no cut.",
    description: "The same argument as Launch Film, with no cut in it. One object carries the whole film: a post, the gap in your site, your icon, your product's window, the offer. Every scene opens out of the one before, and each thing arrives on its own beat.",
    facts: { Pacing: "Brisk", Transitions: "Morph", Camera: "Dolly", Captions: "None", Music: "Electronic, 120 BPM, scored to the cut", Formats: "16:9" },
    brief: "A launch film for Instagram Feed with no cut in it, for people who built their own site and post every week. The claim: post on Instagram and your website updates itself. Open on the account and its real posts, lead with what keeping the site current by hand costs (26 hours a year), prove it three times, give the price, end on Start free.",
  },
  {
    id: "launch-film",
    name: "Launch Film",
    kind: "Launch",
    line: "One claim in big type, on a beat.",
    description: "One claim about the time or money your product gives back, in big type on a beat. Your app is on screen for seconds, as proof. Written from a brief: who it is for, what today costs them, three proofs, one action.",
    facts: { Pacing: "Brisk", Transitions: "Cut", Camera: "Static", Captions: "None", Music: "Electronic, 120 BPM, scored to the cut", Formats: "16:9" },
    brief: "A launch film for Instagram Feed, for people who built their own site and post every week. The claim: post on Instagram and your website updates itself. Lead with what keeping it current by hand costs (26 hours a year), prove it three times with the take, give the price, end on Start free.",
  },
  {
    id: "mac-demo",
    name: "Mac Demo",
    kind: "Demo",
    line: "Your app in a browser, on a desktop.",
    description: "Your app in a browser on a Mac desktop. The camera punches in on every click and glides back out, with an oversized cursor to follow.",
    facts: { Pacing: "Standard", Transitions: "Zoom", Camera: "Spring zoom, 2.25x", Captions: "None", Music: "None", Formats: "Desktop frame" },
    brief: "A screen-recording style demo of Instagram Feed on a Mac desktop: add a feed, pick a layout, get the code.",
  },
  {
    id: "studio",
    name: "Studio",
    kind: "Demo",
    line: "A floating window, captions word by word.",
    description: "Your app in a floating window on a soft gradient. 2x punch-ins, a large smooth cursor and captions that light up word by word.",
    facts: { Pacing: "Standard", Transitions: "Zoom", Camera: "Spring zoom, 2x", Captions: "Karaoke", Music: "None", Formats: "16:9, 9:16, 1:1, 4:5" },
    brief: "Show how to put an Instagram feed on a website with Instagram Feed, start to finish, with captions.",
  },
  {
    id: "dynamic-demo",
    name: "Dynamic Demo",
    kind: "Demo",
    line: "A dark stage, a tilted window, title cards.",
    description: "A dark stage, your app's window tilted in space and lit by its own screen. A title card opens each part, the camera cuts between angles and the focus follows the cursor.",
    facts: { Pacing: "Standard", Transitions: "Cut", Camera: "Dolly", Captions: "None", Music: "Minimal electronic, 104 BPM", Formats: "16:9, 9:16, 1:1, 4:5" },
    brief: "A dynamic demo for Instagram Feed: from an empty dashboard to a feed on a website in under a minute. One title per step, end on the address.",
  },
];

/** app/src/data/captions.ts */
export const captions = [
  { id: "pop", name: "Pop", family: "Social", desc: "Two or three heavy words, the spoken one grows and takes the colour.", chunk: 14 },
  { id: "karaoke", name: "Karaoke", family: "Social", desc: "A full line in outlined type, each word lighting up as it is said.", chunk: 24 },
  { id: "block", name: "Blocks", family: "Social", desc: "Every word in its own box, the spoken one in colour.", chunk: 22 },
  { id: "oneword", name: "One word", family: "Social", desc: "A single huge word at a time. For hooks and very short clips.", chunk: 1 },
  { id: "marker", name: "Marker", family: "Social", desc: "Bold type with a highlighter stroke moving from word to word.", chunk: 22 },
  { id: "punch", name: "Punch", family: "Social", desc: "Slanted capitals on a hard shadow, like a poster.", chunk: 16 },
  { id: "stack", name: "Stack", family: "Social", desc: "One word per line, stacked, the spoken line in colour.", chunk: 15 },
  { id: "outline", name: "Outline", family: "Social", desc: "Hollow letters that fill in as the voice reaches them.", chunk: 20 },
  { id: "neon", name: "Neon", family: "Social", desc: "White type, the spoken word glowing.", chunk: 22 },
  { id: "label", name: "Label", family: "Social", desc: "A strip of white tape, slightly askew, the spoken word marked.", chunk: 20 },
  { id: "bubble", name: "Bubble", family: "Social", desc: "A message bubble, the spoken word in a dark pill.", chunk: 26 },
  { id: "typewriter", name: "Typewriter", family: "Social", desc: "Typed out word by word behind a caret.", chunk: 28 },
  { id: "subtitle", name: "Subtitle", family: "Classic", desc: "White on a dark bar: readable on anything.", chunk: 38 },
  { id: "cinema", name: "Cinema", family: "Classic", desc: "Warm film subtitles with a soft shadow and no bar.", chunk: 40 },
  { id: "cc", name: "Closed caption", family: "Classic", desc: "Monospaced white on solid black, as on television.", chunk: 30 },
  { id: "lower", name: "Lower third", family: "Classic", desc: "A panel set to the left with a coloured edge, like a news strap.", chunk: 34 },
  { id: "clean", name: "Clean", family: "Clean", desc: "Plain white type, the words still to come held back.", chunk: 30 },
  { id: "fade", name: "Fade in", family: "Clean", desc: "Each word appears as it is said and stays.", chunk: 30 },
  { id: "underline", name: "Underline", family: "Clean", desc: "Plain type with a coloured rule under the spoken word.", chunk: 26 },
  { id: "glass", name: "Glass", family: "Clean", desc: "A frosted pill that lets the picture through.", chunk: 28 },
];
export const captionAccents = ["#d3f261", "#ffe14d", "#ffffff", "#ff6aa9", "#5ce1ff", "#ff8a3d"];

/** app/src/data/backgrounds.ts: the drawn ones are CSS, the pictures are files in assets/library/backgrounds */
const pic = (id, name) => ({ id, name, from: "the library", img: id });
export const backgrounds = [
  { id: "dusk", name: "Dusk", from: "Studio", css: "radial-gradient(78% 98% at 6% 8%, #4459ee 0%, rgba(68,89,238,0) 70%), radial-gradient(72% 92% at 94% 4%, #9148ee 0%, rgba(145,72,238,0) 70%), radial-gradient(82% 98% at 92% 102%, #f0628c 0%, rgba(240,98,140,0) 68%), radial-gradient(74% 92% at 2% 102%, #1fb0bb 0%, rgba(31,176,187,0) 68%), linear-gradient(135deg, #2c3190, #4a2a94)" },
  { id: "noir", name: "Noir", from: "Dynamic Demo", css: "radial-gradient(62% 84% at 14% 6%, rgba(96,84,255,.34) 0%, rgba(96,84,255,0) 72%), radial-gradient(54% 74% at 92% 100%, rgba(255,96,150,.17) 0%, rgba(255,96,150,0) 72%), radial-gradient(46% 60% at 84% 8%, rgba(40,150,200,.12) 0%, rgba(40,150,200,0) 72%), radial-gradient(130% 130% at 50% 46%, #0c0d14 0%, #050508 100%)" },
  { id: "ember", name: "Ember", from: "Studio", css: "radial-gradient(78% 98% at 6% 8%, #ffa23f 0%, rgba(255,162,63,0) 70%), radial-gradient(72% 92% at 94% 4%, #ff6480 0%, rgba(255,100,128,0) 70%), radial-gradient(82% 98% at 92% 102%, #8f4fec 0%, rgba(143,79,236,0) 68%), radial-gradient(74% 92% at 2% 102%, #f4c844 0%, rgba(244,200,68,0) 68%), linear-gradient(135deg, #f0703e, #c04492)" },
  { id: "midnight", name: "Midnight", from: "Studio", css: "radial-gradient(70% 90% at 10% 6%, #2a4aa6 0%, rgba(42,74,166,0) 70%), radial-gradient(66% 86% at 92% 98%, #43309a 0%, rgba(67,48,154,0) 68%), radial-gradient(56% 72% at 84% 6%, #1a6c7c 0%, rgba(26,108,124,0) 70%), linear-gradient(135deg, #0d1230, #15183e)" },
  { id: "lime", name: "Lime", from: "Studio", css: "radial-gradient(78% 98% at 6% 8%, #b9e043 0%, rgba(185,224,67,0) 70%), radial-gradient(72% 92% at 94% 4%, #33ba90 0%, rgba(51,186,144,0) 70%), radial-gradient(82% 98% at 92% 102%, #1f8296 0%, rgba(31,130,150,0) 68%), linear-gradient(135deg, #25564a, #1b4458)" },
  pic("silk", "Silk"), pic("glass", "Glass"), pic("ink", "Ink"), pic("bokeh", "City lights"), pic("paper", "Paper"), pic("plaster", "Plaster"), pic("forms", "Forms"),
  pic("dunes", "Dunes"), pic("peaks", "Peaks"), pic("ocean", "Ocean"), pic("clouds", "Clouds"), pic("ridges", "Ridges"), pic("coast", "Coast"),
];

/** app/src/data/scenes.ts: rooms with nobody in them */
export const scenes = [
  { id: "white-studio", name: "Studio" }, { id: "podcast", name: "Podcast" }, { id: "stage", name: "Stage" }, { id: "startup", name: "Startup" }, { id: "night-office", name: "Night office" },
  { id: "home-office", name: "Home office" }, { id: "loft", name: "Loft" }, { id: "living-room", name: "Living room" }, { id: "rooftop", name: "Rooftop" }, { id: "garden", name: "Garden" },
];

/** app/src/data/library.ts: nobody here exists, each presenter is a generated picture */
export const presenters = [
  { id: "maya", name: "Maya", scene: "white-studio", tone: "Friendly guide" },
  { id: "daniel", name: "Daniel", scene: "startup", tone: "Straight to the point" },
  { id: "amara", name: "Amara", scene: "loft", tone: "Upbeat host" },
  { id: "kenji", name: "Kenji", scene: "podcast", tone: "Calm expert" },
  { id: "lea", name: "Léa", scene: "rooftop", tone: "Founder energy" },
  { id: "samuel", name: "Samuel", scene: "night-office", tone: "Trustworthy" },
  { id: "noor", name: "Noor", scene: "living-room", tone: "Warm and quick" },
  { id: "felix", name: "Felix", scene: "stage", tone: "Keynote style" },
  { id: "zara", name: "Zara", scene: "garden", tone: "Relaxed creator" },
];

export const voices = [
  { name: "Will", who: "Male, American", tones: "Relaxed, friendly", best: "Product demos" },
  { name: "Inès", who: "Female, American", tones: "Warm, clear", best: "Product demos" },
  { name: "Theo", who: "Male, American", tones: "Energetic, crisp", best: "Launch teasers" },
  { name: "Oliver", who: "Male, British", tones: "Calm, assured", best: "Explainers" },
  { name: "Maya", who: "Female, American", tones: "Friendly, patient", best: "Onboarding" },
  { name: "Camille", who: "Female, French", tones: "Bright, natural", best: "Social clips" },
  { name: "Kwame", who: "Male, Ghanaian English", tones: "Deep, warm", best: "Brand stories" },
  { name: "Sora", who: "Neutral English", tones: "Even, modern", best: "Dev tools" },
  { name: "Lukas", who: "Male, German", tones: "Precise, steady", best: "B2B explainers" },
  { name: "Priyanka", who: "Female, Indian English", tones: "Upbeat, clear", best: "Tutorials" },
  { name: "Matteo", who: "Male, Italian", tones: "Smooth, relaxed", best: "Lifestyle apps" },
];
export const languages = ["English (US)", "English (UK)", "French", "German", "Spanish (Spain)", "Spanish (LatAm)", "Italian", "Portuguese (BR)", "Portuguese (PT)", "Dutch", "Polish", "Swedish", "Danish", "Norwegian", "Finnish", "Czech", "Romanian", "Greek", "Turkish", "Russian", "Ukrainian", "Arabic", "Hindi", "Indonesian", "Filipino", "Malay", "Japanese", "Korean", "Chinese (Mandarin)"];

/** Where things come on the picture, by shape of frame (app/src/data/layout.ts), and the size type comes in (components/plan/Frame.tsx). */
export const layout = {
  comes: {
    "16:9": { app: { x: 0.5, y: 0.5, w: 0.62 }, presenter: { x: 0.87, y: 0.78, w: 0.146 }, host: { x: 0.5, y: 0.55, w: 0.405 }, captions: { x: 0.5, y: 0.885, w: 1 } },
    "1:1": { app: { x: 0.5, y: 0.475, w: 0.86 }, presenter: { x: 0.84, y: 0.84, w: 0.22 }, host: { x: 0.5, y: 0.57, w: 0.69 }, captions: { x: 0.5, y: 0.88, w: 1 } },
    "4:5": { app: { x: 0.5, y: 0.45, w: 0.88 }, presenter: { x: 0.84, y: 0.86, w: 0.24 }, host: { x: 0.5, y: 0.6, w: 0.8 }, captions: { x: 0.5, y: 0.88, w: 1 } },
    "9:16": { app: { x: 0.5, y: 0.43, w: 0.88 }, presenter: { x: 0.8, y: 0.84, w: 0.28 }, host: { x: 0.5, y: 0.71, w: 0.825 }, captions: { x: 0.5, y: 0.88, w: 1 } },
  },
  typeBase: { "16:9": 3.7, "1:1": 5.4, "4:5": 6.2, "9:16": 7.6 },
  ratio: { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1, "4:5": 4 / 5 },
};

/** The line the canvas on the home page speaks: the first section of a video the app made of Instagram Feed. */
export const stageLine = "Meet Instagram Feed. Your posts live on your website, in layouts that stop the scroll.";

/** app/src/data/workspace.ts and pages/Billing.tsx */
export const plans = [
  { id: "trial", name: "Trial", price: 0, yearly: 0, unit: "", blurb: "See your own app in a real video before paying anything.", features: ["1 video, up to 45 s", "720p with a watermark", "1 connected app", "The plan to check first", "No card required"] },
  { id: "launch", name: "Launch packs", price: 29, yearly: 29, unit: "for 1 video", blurb: "Pay per video. Credits never expire.", features: ["1 credit is 1 video up to 90 s", "1080p, no watermark", "3 connected apps", "All formats from one shoot", "10 revisions per video"] },
  { id: "pro", name: "Pro", price: 49, yearly: 39, unit: "a month", blurb: "For makers who ship often and keep videos fresh.", features: ["4 credits a month, rollover up to 8", "10 connected apps", "Freshness monitor, weekly", "Editable export: Resolve, Premiere, Final Cut", "Stock presenters and voice cloning", "3 brand kits, 4K", "Extra credits $12"], highlight: true },
  { id: "studio", name: "Studio", price: 149, yearly: 119, unit: "a month", blurb: "For studios and agencies shipping for clients.", features: ["15 credits a month", "Unlimited apps (fair use 50)", "5 seats, then $15 per seat", "Your own presenter", "API and webhooks", "Priority queue", "White-label share pages", "Extra credits $9"] },
];
export const packs = [{ credits: 1, price: 29 }, { credits: 5, price: 99 }, { credits: 15, price: 249 }];
export const compare = [
  ["Credits", ["1 trial video", "Buy as needed", "4 a month", "15 a month"]],
  ["Connected apps", ["1", "3", "10", "Unlimited"]],
  ["Resolution", ["720p, watermark", "1080p", "Up to 4K", "Up to 4K"]],
  ["All formats from one shoot", ["", "yes", "yes", "yes"]],
  ["Revisions per video", ["2", "10", "10", "10"]],
  ["Freshness monitor", ["", "", "Weekly", "Daily"]],
  ["Editable export", ["", "", "Resolve, Premiere, Final Cut", "Resolve, Premiere, Final Cut"]],
  ["AI presenter", ["", "", "Stock presenters", "Stock and your own"]],
  ["Voice cloning", ["", "", "yes", "yes"]],
  ["Seats", ["1", "1", "4", "5, then $15"]],
  ["API and webhooks", ["", "", "", "yes"]],
  ["Queue", ["Standard", "Standard", "Standard", "Priority"]],
];

/** app/src/data/workspace.ts: the services the product is planned to rely on */
export const subprocessors = [
  ["Anthropic", "Exploration, planning, guard model", "US, standard contractual clauses"],
  ["ElevenLabs", "Voice-over and music", "EU and US"],
  ["Hetzner", "Exploration and shoot workers", "EU, Germany"],
  ["AWS", "Rendering and key management", "EU, Frankfurt"],
  ["Cloudflare", "Video storage and delivery", "EU jurisdiction"],
  ["Stripe", "Payments", "EU and US"],
  ["Postmark", "Transactional email", "US, standard contractual clauses"],
];

/** The other Vanssay products, in the footer and on the About page. */
export const vanssay = [
  { name: "Reviews", href: "https://vanssay.net/reviews.html", icon: "star", line: "Google and Trustpilot reviews with one combined rating." },
  { name: "Instagram Feed", href: "https://vanssay.net/instagram.html", icon: "instagram-logo", line: "Your live Instagram feed, synced on its own." },
  { name: "Bouncer", href: "https://vanssay.net/geoblock.html", icon: "shield-slash", line: "Block countries and VPN traffic on your site." },
  { name: "Router", href: "https://vanssay.net/router.html", icon: "signpost", line: "Send visitors to the right page by country or language." },
  { name: "Maintenance Mode", href: "https://vanssay.net/maintenance.html", icon: "wrench", line: "A maintenance page you switch on live." },
  { name: "Google Reviews Live", href: "https://vanssay.net/google-reviews-live.html", icon: "google-logo", line: "Live Google reviews, one-time purchase." },
];
