import { Event } from "@common/event";
import type { ConfigChangeEvent, UserConfig } from "@common/types";
import { CONFIG_KEYS, CONFIG_STORAGE_KEY } from "./builtin";
import { storage } from "./storage";

function createConfigChangeEvent(oldConfig: UserConfig, newConfig: UserConfig): ConfigChangeEvent {
  return {
    oldConfig,
    newConfig,
    changedKeys: CONFIG_KEYS.filter(
      (key) => JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key]),
    ),
  };
}

const didChangeConfig = new Event<ConfigChangeEvent>();

export function emitConfigChange(oldConfig: UserConfig, newConfig: UserConfig) {
  didChangeConfig.emit(createConfigChangeEvent(oldConfig, newConfig));
}

export function onDidChange(
  normalizeConfig: (config?: unknown) => UserConfig,
  listener: (event: ConfigChangeEvent) => void,
) {
  if (!storage.hasChangeEvents) return didChangeConfig.on(listener);

  return storage.subscribe(CONFIG_STORAGE_KEY, ({ oldValue, newValue }) => {
    listener(createConfigChangeEvent(normalizeConfig(oldValue), normalizeConfig(newValue)));
  });
}
