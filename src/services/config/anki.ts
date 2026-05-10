import type { AnkiConfig } from "@common/types";
import { DEFAULT_ANKI_CONFIG } from "./builtin";

export function normalizeAnkiConfig(ankiConfig?: unknown): AnkiConfig {
  const config =
    ankiConfig && typeof ankiConfig === "object" ? (ankiConfig as Record<string, unknown>) : {};

  return {
    connectUrl:
      typeof config.connectUrl === "string" ? config.connectUrl : DEFAULT_ANKI_CONFIG.connectUrl,
  };
}
