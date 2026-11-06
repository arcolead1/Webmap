(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "webmap-theme";

  function currentTheme() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#05070a" : "#f4f6f8");
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}
    }
  }

  applyTheme(currentTheme(), false);

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  });
})();