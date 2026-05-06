import type {
  AnkiConfig,
  AnkiModel,
  ConfigChangeEvent,
  DictionaryEntry,
  DictionaryLanguageInfo,
  DictionaryLookupParams,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  PlatformServices,
  UserConfig,
} from "@common/model";
import { CONFIG_STORAGE_KEY, DEFAULT_USER_CONFIG } from "@common/model";
import { createDirectPlatformServices } from "./direct";

function getValueAtPath(value: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

function createConfigChangeEvent(
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

type ServiceDomain = keyof PlatformServices;

interface ServiceMessage {
  type: "service";
  domain: ServiceDomain;
  method: string;
  args: unknown[];
}

function callService<T>(domain: ServiceDomain, method: string, ...args: unknown[]) {
  return chrome.runtime.sendMessage({
    type: "service",
    domain,
    method,
    args,
  } satisfies ServiceMessage) as Promise<T | { error: string }>;
}

async function invoke<T>(domain: ServiceDomain, method: string, ...args: unknown[]): Promise<T> {
  const result = await callService<T>(domain, method, ...args);
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    throw new Error(result.error);
  }
  return result as T;
}

class ChromeConfigService implements IConfigService {
  onDidChange(listener: (event: ConfigChangeEvent) => void) {
    let previousConfig: UserConfig = DEFAULT_USER_CONFIG;
    void this.get().then((config) => {
      previousConfig = config;
    });

    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "sync" || !(CONFIG_STORAGE_KEY in changes)) return;

      void this.get().then((currentConfig) => {
        const event = createConfigChangeEvent(previousConfig, currentConfig);
        previousConfig = currentConfig;
        listener(event);
      });
    };

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }

  async get(): Promise<UserConfig> {
    return invoke("config", "get");
  }

  async set(userConfig: UserConfig): Promise<void> {
    await invoke("config", "set", userConfig);
  }

  async update(partial: Partial<UserConfig>): Promise<void> {
    await invoke("config", "update", partial);
  }

  async reset(): Promise<UserConfig> {
    return invoke("config", "reset");
  }

  async getLanguageCodes(): Promise<string[]> {
    return invoke("config", "getLanguageCodes");
  }
}

class ChromeDictionaryService implements IDictionaryService {
  async getLanguages(): Promise<DictionaryLanguageInfo[]> {
    return invoke("dictionary", "getLanguages");
  }

  async lookup(params: DictionaryLookupParams): Promise<DictionaryEntry | null> {
    return invoke("dictionary", "lookup", params);
  }
}

class ChromeAnkiService implements IAnkiService {
  async addNote(result: DictionaryEntry): Promise<unknown> {
    return invoke("anki", "addNote", result);
  }

  async getDecks(): Promise<string[]> {
    return invoke("anki", "getDecks");
  }

  async getModels(): Promise<string[]> {
    return invoke("anki", "getModels");
  }

  async getModelFields(modelName: string): Promise<string[]> {
    return invoke("anki", "getModelFields", modelName);
  }

  async syncModel(ankiConfig: AnkiConfig): Promise<void> {
    await invoke("anki", "syncModel", ankiConfig);
  }
}

export function createChromePlatformServices(): PlatformServices {
  return {
    config: new ChromeConfigService(),
    dictionary: new ChromeDictionaryService(),
    anki: new ChromeAnkiService(),
  };
}

export function initChromeServices({ getDefaultModel }: { getDefaultModel: () => AnkiModel }) {
  const services = createDirectPlatformServices({ getDefaultModel });

  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return;

    const { type, domain, method, args } = message as Partial<ServiceMessage>;
    if (type !== "service") return;
    if (domain !== "config" && domain !== "dictionary" && domain !== "anki") return;
    if (typeof method !== "string") return;
    if (!Array.isArray(args)) return;

    const service = services[domain] as unknown as Record<string, unknown>;
    const handler = service[method];
    if (typeof handler !== "function") return;

    Promise.resolve(handler.apply(service, args))
      .then(sendResponse)
      .catch((error: Error) => {
        console.error(`[Service Error] ${domain}.${method}:`, error);
        sendResponse({ error: error.message });
      });

    return true;
  });
}
