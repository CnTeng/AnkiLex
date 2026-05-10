import type { DictionaryEntry } from "@common/types";
import { AnkiCardBack, AnkiCardFront } from "@views/dictionary/card";

function getData(): DictionaryEntry | null {
  const el = document.getElementById("raw-data");
  if (!el?.textContent) return null;

  try {
    return JSON.parse(el.textContent) as DictionaryEntry;
  } catch {
    return null;
  }
}

export function initAnkiFront() {
  const entry = getData();
  const root = document.getElementById("ankilex-front-root");
  if (!entry || !root) return;

  const rawAudio = document.getElementById("raw-audio");
  const soundLinks = rawAudio
    ? (Array.from(rawAudio.querySelectorAll(".soundLink")) as HTMLAnchorElement[])
    : [];

  root.replaceChildren();
  new AnkiCardFront({ container: root, entry, soundLinks });
}

export function initAnkiBack() {
  const entry = getData();
  const root = document.getElementById("ankilex-back-root");
  if (!entry || !root) return;

  root.replaceChildren();
  new AnkiCardBack({ container: root, entry });
}
