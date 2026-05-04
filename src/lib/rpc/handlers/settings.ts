import type { UserSettings } from "@lib/model";
import { useSettings } from "@lib/settings";

export const settingsHandlers = {
  get: async () => useSettings.get(),
  set: async (data: { settings: UserSettings }) => useSettings.set(data.settings),
  update: async (data: { partial: Partial<UserSettings> }) => {
    const current = await useSettings.get();
    const next = {
      languages: data.partial.languages ?? current.languages,
      anki: data.partial.anki ?? current.anki,
    };
    await useSettings.set(next);
  },
  reset: async () => {
    await useSettings.reset();
    return useSettings.get();
  },
};
