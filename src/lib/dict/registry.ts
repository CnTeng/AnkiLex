import type { IDictionaryProvider } from "@lib/model";

const providers: Map<string, IDictionaryProvider> = new Map();

export function registerDictionaryProvider(provider: IDictionaryProvider): void {
  providers.set(provider.id, provider);
}

export function getDictionaryProvider(id: string): IDictionaryProvider | undefined {
  return providers.get(id);
}

export function listDictionaryProviders(): IDictionaryProvider[] {
  return Array.from(providers.values());
}
