import type { ConfigChangeEvent, UserConfig } from "@common/model";

function getValueAtPath(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

export function createConfigChangeEvent(
  previousConfig: UserConfig,
  currentConfig: UserConfig,
): ConfigChangeEvent {
  return {
    currentConfig,
    previousConfig,
    affects: (path: string) =>
      JSON.stringify(getValueAtPath(previousConfig, path)) !==
      JSON.stringify(getValueAtPath(currentConfig, path)),
  };
}
