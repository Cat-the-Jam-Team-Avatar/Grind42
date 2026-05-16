const STORAGE_KEY = "grind42-theme";

export default function themeBootScript() {
  return `
    (function() {
      try {
        var key = "${STORAGE_KEY}";
        var stored = window.localStorage.getItem(key);
        var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;
}
