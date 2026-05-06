import type {
  AnkiConfig,
  AnkiState,
  ConfigChangeEvent,
  DictionaryLanguageInfo,
  PlatformServices,
  UserConfig,
} from "@lib/model";
import { normalizeAnkiFieldMap } from "@lib/model";
import { cn } from "tailwind-variants";
import { AnkiOptions } from "./anki";
import { DictionaryOptions } from "./dict";
import { OptionsFooter } from "./footer";
import { loadOptionsState, resetOptionsState } from "./state";

function showLoadError(doc: Document, root: HTMLElement, error: unknown) {
  root.replaceChildren(
    createStateMessage(doc, error instanceof Error ? error.message : String(error)),
  );
}

function sameUserConfig(a: UserConfig, b: UserConfig) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mergeAnkiConfig(ankiConfig: AnkiConfig, ankiState: AnkiState): AnkiConfig {
  return {
    ...ankiConfig,
    noteType: ankiState.noteType,
    fieldMap: normalizeAnkiFieldMap(ankiState.fieldNames, ankiConfig.fieldMap),
  };
}

function createPageIntro(doc: Document) {
  const header = doc.createElement("section");
  const title = doc.createElement("h1");
  title.className = cn("text-xl font-semibold") as string;
  title.textContent = "Options";
  const text = doc.createElement("p");
  text.className = cn("mt-1 text-sm") as string;
  text.textContent =
    "Tune dictionary sources, connect Anki, and keep note generation aligned with your workflow.";
  header.append(title, text);
  return header;
}

function createStateMessage(doc: Document, message: string) {
  const element = doc.createElement("div");
  element.className = cn("p-4 text-sm") as string;
  element.textContent = message;
  return element;
}

export class OptionsPage {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly root: HTMLElement;
  private readonly services: PlatformServices;
  private readonly footer: OptionsFooter;
  private readonly dictionaryOptions: DictionaryOptions;
  private readonly ankiOptions: AnkiOptions;
  private readonly unsubscribeConfigChange: () => void;

  private userConfig: UserConfig;
  private dictionaryLanguages: DictionaryLanguageInfo[];
  private ankiState: AnkiState;
  private savedUserConfig: UserConfig;
  private saveChain = Promise.resolve();
  private reloadChain = Promise.resolve();

  private constructor({
    doc = document,
    root,
    services,
    userConfig,
    dictionaryLanguages,
    ankiState,
  }: {
    doc?: Document;
    root: HTMLElement;
    services: PlatformServices;
    userConfig: UserConfig;
    dictionaryLanguages: DictionaryLanguageInfo[];
    ankiState: AnkiState;
  }) {
    this.doc = doc;
    this.root = root;
    this.services = services;
    this.userConfig = userConfig;
    this.dictionaryLanguages = dictionaryLanguages;
    this.ankiState = ankiState;
    this.savedUserConfig = userConfig;

    this.element = this.doc.createElement("div");
    this.element.className = "bg-base-100 text-base-content";

    const sections = this.doc.createElement("div");
    sections.className = cn("space-y-6 p-4") as string;

    this.footer = new OptionsFooter(this.doc);
    this.footer.setResetAction(() => this.reset());

    this.dictionaryOptions = new DictionaryOptions({
      doc: this.doc,
      getDictionaryConfig: () => this.userConfig.dictionary,
      setDictionaryConfig: (dictionaryConfig) => this.setDictionaryConfig(dictionaryConfig),
      getDictionaryLanguages: () => this.dictionaryLanguages,
      getDeckOptions: () => this.ankiState.deckOptions,
    });

    this.ankiOptions = new AnkiOptions({
      doc: this.doc,
      ankiService: this.services.anki,
      getConfig: () => this.userConfig.anki,
      setConfig: (ankiConfig) => this.setAnkiConfig(ankiConfig),
      setAnkiState: (nextAnkiState, nextAnkiConfig) =>
        this.setAnkiState(nextAnkiState, nextAnkiConfig),
      getAnkiState: () => this.ankiState,
      showStatus: (level, message) => this.footer.status.show(message, level),
    });

    sections.append(
      createPageIntro(this.doc),
      this.dictionaryOptions.element,
      this.ankiOptions.element,
    );
    this.element.append(sections, this.footer.element);
    this.root.replaceChildren(this.element);

    this.unsubscribeConfigChange = this.services.config.onDidChange((event) => {
      void this.reloadFromConfig(event);
    });
    this.render();
  }

  static async create({
    doc = document,
    root,
    services,
  }: {
    doc?: Document;
    root: HTMLElement;
    services: PlatformServices;
  }) {
    root.replaceChildren(createStateMessage(doc, "Loading options..."));

    const userConfig = await services.config.get();
    const { dictionaryLanguages, ankiState } = await loadOptionsState(services, userConfig);
    return new OptionsPage({
      doc,
      root,
      services,
      userConfig,
      dictionaryLanguages,
      ankiState,
    });
  }

  dispose() {
    this.unsubscribeConfigChange();
  }

  private render() {
    this.dictionaryOptions.render();
    this.ankiOptions.render();
  }

  private async saveUserConfig(nextUserConfig: UserConfig, errorMessage: string) {
    if (sameUserConfig(nextUserConfig, this.savedUserConfig)) return;

    const task = this.saveChain.then(() => {
      if (sameUserConfig(nextUserConfig, this.savedUserConfig)) return;
      return this.services.config.update(nextUserConfig).then(() => {
        this.savedUserConfig = nextUserConfig;
      });
    });

    this.saveChain = task.catch(() => undefined);
    await task.catch((error) => {
      this.footer.status.show(
        `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    });
  }

  private async setDictionaryConfig(dictionaryConfig: UserConfig["dictionary"]) {
    this.userConfig = {
      ...this.userConfig,
      dictionary: dictionaryConfig,
    };
    this.render();
    await this.saveUserConfig(this.userConfig, "Failed to save dictionary settings");
  }

  private async setAnkiConfig(ankiConfig: AnkiConfig) {
    this.userConfig = {
      ...this.userConfig,
      anki: ankiConfig,
    };
    this.render();
    await this.saveUserConfig(this.userConfig, "Failed to save Anki settings");
  }

  private setAnkiState(nextAnkiState: AnkiState, nextAnkiConfig?: AnkiConfig) {
    this.ankiState = nextAnkiState;
    this.userConfig = {
      ...this.userConfig,
      anki: mergeAnkiConfig(nextAnkiConfig ?? this.userConfig.anki, nextAnkiState),
    };
    this.render();
  }

  private async reset() {
    if (!this.doc.defaultView?.confirm("Are you sure you want to reset all options to defaults?")) {
      return;
    }

    await resetOptionsState(this.services)
      .then(async ({ userConfig, ankiState }) => {
        const { dictionaryLanguages } = await loadOptionsState(this.services, userConfig);
        this.userConfig = userConfig;
        this.savedUserConfig = userConfig;
        this.ankiState = ankiState;
        this.dictionaryLanguages = dictionaryLanguages;
        this.render();
        this.footer.status.show("Options reset to defaults.", "success");
      })
      .catch((error) => {
        this.footer.status.show(
          `Failed to reset options: ${error instanceof Error ? error.message : String(error)}`,
          "error",
        );
      });
  }

  private reloadFromConfig(event: ConfigChangeEvent) {
    if (!event.affects("dictionary") && !event.affects("anki")) return this.reloadChain;

    this.reloadChain = this.reloadChain
      .then(async () => {
        const nextUserConfig = event.currentConfig;
        const { dictionaryLanguages, ankiState } = await loadOptionsState(
          this.services,
          nextUserConfig,
        );
        this.userConfig = nextUserConfig;
        this.savedUserConfig = nextUserConfig;
        this.dictionaryLanguages = dictionaryLanguages;
        this.ankiState = ankiState;
        this.render();
      })
      .catch((error) => {
        showLoadError(this.doc, this.root, error);
      });

    return this.reloadChain;
  }
}

export type { DictionaryLanguageInfo } from "@lib/model";
