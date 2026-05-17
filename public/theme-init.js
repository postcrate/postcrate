// Runs before React mounts to apply the persisted theme and avoid FOUC.
// Lives in /public so Vite serves it as a blocking <script src> — bundled
// modules are deferred and run after first paint.
(function () {
  try {
    var raw = localStorage.getItem("postcrate-theme");
    var theme = raw ? JSON.parse(raw).state.theme : "system";
    var dark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    if (dark) root.classList.add("dark");
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {
    /* localStorage unavailable — fall back to CSS default */
  }
})();
