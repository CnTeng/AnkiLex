import { ankiHandlers } from "./anki";
import { dictionaryHandlers } from "./dictionary";
import { settingsHandlers } from "./settings";

export const allHandlers = {
  anki: ankiHandlers,
  dictionary: dictionaryHandlers,
  settings: settingsHandlers,
};

export type AllHandlers = typeof allHandlers;
