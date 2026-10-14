/*
  Framefly site settings. This is the only file to edit to move the launch or wire the forms.
*/
window.FRAMEFLY = {
  // The launch moment, in UTC. 08:01 UTC on November 30, 2026 is 00:01 in San Francisco (the start of a
  // Product Hunt day) and 09:01 in Paris. Every countdown, date and "launch day" label on the site reads this.
  // Moved from October 28 on 2026-10-14: the launch waits for real validation, so treat this date as a placeholder.
  launchAt: "2026-11-30T08:01:00Z",

  // The Framefly API (Framefly.app/api). The admin page talks to it.
  apiBase: "https://api.vanssay.net/framefly",

  // Where the "Notify me" and beta forms POST their JSON (see README.md for the payload).
  // Empty would mean not wired: on framefly.app the forms then fall back to an email draft, anywhere else
  // (local preview) they show the success state and log the payload to the console.
  formEndpoint: "https://api.vanssay.net/framefly/forms",

  // Where the site points once the countdown reaches zero.
  appUrl: "https://app.framefly.app",

  // Optional Stripe Payment Link for the refundable $29 pre-order credit. Empty keeps the pre-order card hidden.
  preorderUrl: "",

  contactEmail: "support@framefly.app",
  xUrl: "https://x.com/MarindeVanssay",
};
