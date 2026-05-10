import type {
  ConfigChangeEvent,
  Context,
  DictionaryEntry,
  DictionaryProviderInfo,
  IAnkiConfigService,
  IAnkiService,
  IConfigService,
  IDictionaryConfigService,
  IDictionaryService,
  UserConfig,
} from "@common/types";
import { config } from "@services/config";
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
  readonly anki: IAnkiConfigService = {
    get: () => this.client.invoke("config", "anki.get"),
    onDidChange: (listener) =>
      this.onDidChange((event) => {
        if (event.changedKeys.includes("anki")) listener(event.newConfig.anki);
      }),
    update: async (ankiConfig) => {
      await this.client.invoke("config", "anki.update", ankiConfig);
    },
  };

  readonly dictionary: IDictionaryConfigService = {
    get: () => this.client.invoke("config", "dictionary.get"),
    onDidChange: (listener) =>
      this.onDidChange((event) => {
        if (event.changedKeys.includes("dictionary")) listener(event.newConfig.dictionary);
      }),
    createProvider: async (providerConfig) => {
      await this.client.invoke("config", "dictionary.createProvider", providerConfig);
    },
    updateProvider: async (providerId, patch) => {
      await this.client.invoke("config", "dictionary.updateProvider", providerId, patch);
    },
    removeProvider: async (providerId) => {
      await this.client.invoke("config", "dictionary.removeProvider", providerId);
    },
    reorderProvider: async (providerId, targetIndex) => {
      await this.client.invoke("config", "dictionary.reorderProvider", providerId, targetIndex);
    },
  };

  constructor(private readonly client: BrowserRuntimeClient) {}

  onDidChange(listener: (event: ConfigChangeEvent) => void) {
    return config.onDidChange(listener);
  }

  async get(): Promise<UserConfig> {
    return this.client.invoke("config", "get");
  }

  async reset(): Promise<UserConfig> {
    return this.client.invoke("config", "reset");
  }
}

class BrowserDictionaryService implements IDictionaryService {
  constructor(private readonly client: BrowserRuntimeClient) {}

  async getProviders(): Promise<DictionaryProviderInfo[]> {
    return this.client.invoke("dictionary", "getProviders");
  }

  async lookup(word: string, context?: Context): Promise<DictionaryEntry | null> {
    return this.client.invoke("dictionary", "lookup", word, context);
  }
}

class BrowserAnkiService implements IAnkiService {
  constructor(private readonly client: BrowserRuntimeClient) {}

  async createNote(result: DictionaryEntry): Promise<void> {
    await this.client.invoke("anki", "createNote", result);
  }

  async getDecks(): Promise<string[]> {
    return this.client.invoke("anki", "getDecks");
  }

  async syncTemplate(): Promise<void> {
    await this.client.invoke("anki", "syncTemplate");
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

  private getHandler(service: Record<string, unknown>, method: string) {
    return method.split(".").reduce(
      (result, key) => {
        const value =
          result.target && typeof result.target === "object"
            ? (result.target as Record<string, unknown>)[key]
            : undefined;
        return {
          target: value,
          parent: result.target,
        };
      },
      { target: service as unknown, parent: undefined as unknown },
    );
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
    const { target: handler, parent } = this.getHandler(service, method);
    if (typeof handler !== "function") return;

    Promise.resolve(handler.apply(parent, args))
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
