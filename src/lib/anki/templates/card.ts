import type { DictionaryEntry } from "@lib/model";
import { AnkiCardBack, AnkiCardFront } from "@lib/ui/dictionary";

const getData = (): DictionaryEntry | null => {
  const el = document.getElementById("raw-data");
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch (_) {
    return null;
  }
};

export const initAnkiFront = () => {
  const entry = getData();
  const root = document.getElementById("ankilex-front-root");
  if (entry && root) {
    const rawAudio = document.getElementById("raw-audio");
    const soundLinks = rawAudio
      ? (Array.from(rawAudio.querySelectorAll(".soundLink")) as HTMLAnchorElement[])
      : [];

    const view = AnkiCardFront({ doc: document, entry, soundLinks });
    root.replaceChildren(view);
  }
};

export const initAnkiBack = () => {
  const entry = getData();
  const root = document.getElementById("ankilex-back-root");
  if (entry && root) {
    const view = AnkiCardBack({ doc: document, entry });
    root.replaceChildren(view);
  }
};
