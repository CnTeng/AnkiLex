import { ANKI_MODEL_CSS } from "./template";

export const ANKI_MODEL_NAME = "OneDict";

export const ANKI_MODEL_FIELDS = [
  "word",
  "definition",
  "examples",
  "pronunciations",
  "audio",
  "metadata",
  "context",
  "version",
] as const;

export const ANKI_TEMPLATE_VERSION = 3;

export const ANKI_TEMPLATE_MARKER = `onedict-template:${ANKI_TEMPLATE_VERSION}`;

export const ANKI_TAG = "onedict";

export const ANKI_AUDIO_FILENAME_PREFIX = "onedict";

export const ANKI_MODEL_STYLE = `/* ${ANKI_TEMPLATE_MARKER} */\n${ANKI_MODEL_CSS}`;
