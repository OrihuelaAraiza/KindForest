// Runs before first paint so a dark system theme never flashes light.
// The visitor's own choice is applied later by app.js and is not stored.
document.documentElement.dataset.theme = matchMedia(
  "(prefers-color-scheme: dark)",
).matches
  ? "dark"
  : "light";
