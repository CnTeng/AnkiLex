import type {
  AnkiModel,
  ConfigChangeEvent,
  Context,
  DictionaryEntry,
  DictionaryLanguageInfo,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  UserConfig,
} from "@common/model";
import { CONFIG_STORAGE_KEY, DEFAULT_USER_CONFIG } from "@common/model";
import { createConfigChangeEvent } from "@services/config/change-event";
import { LocalPlatformServices } from "@services/local";

type ServiceDomain = "config" | "dictionary" | "anki";

interface ServiceMessage {
  type: "service";
  domain: ServiceDomain;
  method: string;
  args: unknown[];
}

function isServiceDomain(domain: unknown): domain is ServiceDomain {
  return domain === "config" || domain === "dictionary" || domain === "anki";
}

class BrowserRuntimeClient {
  private call<T>(domain: ServiceDomain, method: string, ...args: unknown[]) {
    return chrome.runtime.sendMessage({
      type: "service",
      domain,
      method,
      args,
    } satisfies ServiceMessage) as Promise<T | { error: string }>;
  }

  async invoke<T>(domain: ServiceDomain, method: string, ...args: unknown[]): Promise<T> {
    const result = await this.call<T>(domain, method, ...args);
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
}

class BrowserConfigService implements IConfigService {
  constructor(private readonly client: BrowserRuntimeClient) {}

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
        listener(createConfigChangeEvent(previousConfig, currentConfig));
        previousConfig = currentConfig;
      });
    };

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }

  async get(): Promise<UserConfig> {
    return this.client.invoke("config", "get");
  }

  async set(userConfig: UserConfig): Promise<void> {
    await this.client.invoke("config", "set", userConfig);
  }

  async update(partial: Partial<UserConfig>): Promise<void> {
    await this.client.invoke("config", "update", partial);
  }

  async reset(): Promise<UserConfig> {
    return this.client.invoke("config", "reset");
  }

  async getLanguageCodes(): Promise<string[]> {
    return this.client.invoke("config", "getLanguageCodes");
  }
}

class BrowserDictionaryService implements IDictionaryService {
  constructor(private readonly client: BrowserRuntimeClient) {}

  async getLanguages(): Promise<DictionaryLanguageInfo[]> {
    return this.client.invoke("dictionary", "getLanguages");
  }

  async lookup(word: string, context?: Context): Promise<DictionaryEntry | null> {
    return this.client.invoke("dictionary", "lookup", word, context);
  }
}

class BrowserAnkiService implements IAnkiService {
  constructor(private readonly client: BrowserRuntimeClient) {}

  async addNote(result: DictionaryEntry): Promise<unknown> {
    return this.client.invoke("anki", "addNote", result);
  }

  async getDecks(): Promise<string[]> {
    return this.client.invoke("anki", "getDecks");
  }

  async getModels(): Promise<string[]> {
    return this.client.invoke("anki", "getModels");
  }

  async getModelFields(modelName: string): Promise<string[]> {
    return this.client.invoke("anki", "getModelFields", modelName);
  }

  async createModel(model: AnkiModel): Promise<void> {
    await this.client.invoke("anki", "createModel", model);
  }

  async updateModel(model: AnkiModel): Promise<void> {
    await this.client.invoke("anki", "updateModel", model);
  }
}

export class BrowserPlatformServices {
  readonly config: IConfigService;
  readonly dictionary: IDictionaryService;
  readonly anki: IAnkiService;

  constructor(client = new BrowserRuntimeClient()) {
    this.config = new BrowserConfigService(client);
    this.dictionary = new BrowserDictionaryService(client);
    this.anki = new BrowserAnkiService(client);
  }
}

export class BrowserServiceHost {
  private readonly services = new LocalPlatformServices();

  register() {
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }

  private readonly handleMessage = (message: unknown, _sender: unknown, sendResponse: unknown) => {
    if (typeof sendResponse !== "function") return;
    if (!message || typeof message !== "object") return;

    const { type, domain, method, args } = message as Partial<ServiceMessage>;
    if (type !== "service") return;
    if (!isServiceDomain(domain)) return;
    if (typeof method !== "string") return;
    if (!Array.isArray(args)) return;

    const service = this.services[domain] as unknown as Record<string, unknown>;
    const handler = service[method];
    if (typeof handler !== "function") return;

    Promise.resolve(handler.apply(service, args))
      .then((result) => {
        (sendResponse as (value: unknown) => void)(result);
      })
      .catch((error: Error) => {
        console.error(`[Service Error] ${domain}.${method}:`, error);
        (sendResponse as (value: unknown) => void)({ error: error.message });
      });

    return true;
  };
}
