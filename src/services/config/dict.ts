import type { DictionaryConfig, ProviderConfig } from "@common/types";
import { DEFAULT_DICT_CONFIG } from "./builtin";

export function normalizeDictionaryConfig(config?: unknown): DictionaryConfig {
  return Array.isArray(config)
    ? config.map(normalizeProviderConfig)
    : DEFAULT_DICT_CONFIG.map((config) => ({ ...config }));
}

function normalizeProviderConfig(config: unknown): ProviderConfig {
  const providerConfig =
    config && typeof config === "object" ? (config as Record<string, unknown>) : {};

  return {
    provider: typeof providerConfig.provider === "string" ? providerConfig.provider : "",
    deck: typeof providerConfig.deck === "string" ? providerConfig.deck : "",
  };
}

export function createProvider(
  dictionaryConfig: DictionaryConfig,
  providerConfig: ProviderConfig,
): DictionaryConfig {
  if (dictionaryConfig.some((config) => config.provider === providerConfig.provider)) {
    return dictionaryConfig;
  }

  return [...dictionaryConfig, providerConfig];
}

export function updateProvider(
  dictionaryConfig: DictionaryConfig,
  providerId: string,
  patch: Partial<ProviderConfig>,
): DictionaryConfig {
  return dictionaryConfig.map((config) =>
    config.provider === providerId ? { ...config, ...patch } : config,
  );
}

export function removeProvider(
  dictionaryConfig: DictionaryConfig,
  providerId: string,
): DictionaryConfig {
  return dictionaryConfig.filter((config) => config.provider !== providerId);
}

export function reorderProvider(
  dictionaryConfig: DictionaryConfig,
  providerId: string,
  targetIndex: number,
): DictionaryConfig {
  const sourceIndex = dictionaryConfig.findIndex((config) => config.provider === providerId);
  if (sourceIndex < 0) return dictionaryConfig;

  const clampedTargetIndex = Math.max(0, Math.min(targetIndex, dictionaryConfig.length));
  if (sourceIndex === clampedTargetIndex || sourceIndex + 1 === clampedTargetIndex)
    return dictionaryConfig;

  const next = [...dictionaryConfig];
  const [item] = next.splice(sourceIndex, 1);
  next.splice(
    sourceIndex < clampedTargetIndex ? clampedTargetIndex - 1 : clampedTargetIndex,
    0,
    item,
  );
  return next;
}
