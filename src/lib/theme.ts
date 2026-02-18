import { type AnkiLexSettings, STORAGE_KEY } from "./model/settings";
import { settings } from "./settings";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme(): "dark" | "light" {
  if (typeof window.matchMedia !== "function") return "light";
  const mql = window.matchMedia(MEDIA_QUERY);
  return mql?.matches ? "dark" : "light";
}

function apply(theme: AnkiLexSettings["theme"]) {
  const effectiveTheme = theme === "auto" ? getSystemTheme() : theme;

  if (effectiveTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export const theme = {
  async init() {
    const s = await settings.get();
    apply(s.theme);

    // Listen for system preference changes
    if (typeof window.matchMedia === "function") {
      const mql = window.matchMedia(MEDIA_QUERY);
      if (mql) {
        mql.addEventListener("change", async () => {
          const current = await settings.get();
          if (current.theme === "auto") {
            apply("auto");
          }
        });
      }
    }

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes[STORAGE_KEY]) {
        const newSettings = changes[STORAGE_KEY].newValue as AnkiLexSettings;
        if (newSettings?.theme) {
          apply(newSettings.theme);
        }
      }
    });
  },
};
