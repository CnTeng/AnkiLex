import type { Definition, DictionaryEntry, Example, Metadata, Pronunciation } from "@common/types";
import { AnkiCardBack, AnkiCardFront } from "@views/dictionary/card";

function decodeFieldText(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function parseField(id: string, json: false): string | undefined;
function parseField<T>(id: string, json?: true): T | undefined;
function parseField<T>(id: string, json = true): string | T | undefined {
  const text = document.getElementById(id)?.textContent || undefined;
  if (!text) return undefined;

  const value = decodeFieldText(text);
  if (!json) return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function getEntry(): DictionaryEntry | undefined {
  const word = parseField("raw-word", false);
  const definition = parseField<Omit<Definition, "examples">>("raw-definition");
  const examples = parseField<Example[]>("raw-examples") ?? [];
  const pronunciations = parseField<Pronunciation[]>("raw-pronunciations") ?? [];
  const metadata = parseField<Metadata>("raw-metadata");
  const context = parseField("raw-context", false);

  if (!word || !definition || !metadata) return undefined;

  return {
    word,
    definitions: [{ ...definition, examples }],
    pronunciations,
    metadata,
    context,
  };
}

export function initAnkiFront() {
  const entry = getEntry();
  const root = document.getElementById("onedict-front-root");
  if (!entry || !root) return;

  const rawAudio = document.getElementById("raw-audio");
  const soundLinks = Array.from(rawAudio?.querySelectorAll<HTMLAnchorElement>(".soundLink") ?? []);

  root.replaceChildren();
  new AnkiCardFront({ container: root, entry, soundLinks });
}

export function initAnkiBack() {
  const entry = getEntry();
  const root = document.getElementById("onedict-back-root");
  if (!entry || !root) return;

  root.replaceChildren();
  new AnkiCardBack({ container: root, entry });
}
