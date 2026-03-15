import type { AnkiLexSettings } from "@lib/model";
import { settings } from "@lib/settings";

export const settingsHandlers = {
  get: async () => settings.get(),
  update: async (data: { partial: Partial<AnkiLexSettings> }) => settings.update(data.partial),
  reset: async () => settings.reset(),
};
