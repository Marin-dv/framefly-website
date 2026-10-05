/*
  Framefly site settings. This is the only file to edit to move the launch or wire the forms.
*/
window.FRAMEFLY = {
  // The launch moment, in UTC. 07:01 UTC on October 28, 2026 is 00:01 in San Francisco (the start of a
  // Product Hunt day) and 08:01 in Paris. Every countdown, date and "launch day" label on the site reads this.
  launchAt: "2026-10-28T07:01:00Z",

  // Where the "Notify me" and beta forms POST their JSON (see README.md for the payload).
  // Empty means not wired yet: on framefly.app the forms fall back to an email draft, anywhere else
  // (local preview) they show the success state and log the payload to the console.
  formEndpoint: "",

  // Where the site points once the countdown reaches zero.
  appUrl: "https://app.framefly.app",

  // Optional Stripe Payment Link for the refundable $29 pre-order credit. Empty keeps the pre-order card hidden.
  preorderUrl: "",

  contactEmail: "support@framefly.app",
  xUrl: "https://x.com/MarindeVanssay",
};
