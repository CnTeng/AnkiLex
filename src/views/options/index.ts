import type {
  AnkiConfig,
  AnkiState,
  ConfigChangeEvent,
  DictionaryLanguageInfo,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  UserConfig,
} from "@common/model";
import { ANKI_DEFAULT_MODEL_NAME } from "@common/model";
import { cn } from "tailwind-variants";
import { ANKI_DEFAULT_MODEL } from "@views/dictionary/templates";
import { AnkiOptions } from "./anki";
import { DictionaryOptions } from "./dict";
import { OptionsFooter } from "./footer";
import { loadAnkiState, loadOptionsState, resetOptionsState } from "./state";

export class OptionsPage {
  private readonly container: HTMLElement;
  private readonly document: Document;
  private readonly element: HTMLDivElement;
  private readonly configService: IConfigService;
  private readonly dictionaryService: IDictionaryService;
  private readonly ankiService: IAnkiService;
  private footer!: OptionsFooter;
  private dictionaryOptions!: DictionaryOptions;
  private ankiOptions!: AnkiOptions;
  private readonly unsubscribeConfigChange: () => void;

  private userConfig: UserConfig;
  private dictionaryLanguages: DictionaryLanguageInfo[];
  private ankiState: AnkiState;
  private savedUserConfig: UserConfig;
  private saveChain = Promise.resolve();
  private reloadChain = Promise.resolve();

  private constructor({
    container,
    configService,
    dictionaryService,
    ankiService,
    userConfig,
    dictionaryLanguages,
    ankiState,
  }: {
    container: HTMLElement;
    configService: IConfigService;
    dictionaryService: IDictionaryService;
    ankiService: IAnkiService;
    userConfig: UserConfig;
    dictionaryLanguages: DictionaryLanguageInfo[];
    ankiState: AnkiState;
  }) {
    this.container = container;
    this.document = container.ownerDocument;
    this.configService = configService;
    this.dictionaryService = dictionaryService;
    this.ankiService = ankiService;
    this.userConfig = userConfig;
    this.dictionaryLanguages = dictionaryLanguages;
    this.ankiState = ankiState;
    this.savedUserConfig = userConfig;

    this.element = this.document.createElement("div");
    this.element.className = "bg-background text-foreground";

    this.renderStructure();
    this.container.replaceChildren(this.element);

    this.unsubscribeConfigChange = this.configService.onDidChange((event) => {
      void this.reloadFromConfig(event);
    });
    this.render();
  }

  static async create({
    container,
    configService,
    dictionaryService,
    ankiService,
  }: {
    container: HTMLElement;
    configService: IConfigService;
    dictionaryService: IDictionaryService;
    ankiService: IAnkiService;
  }) {
    const document = container.ownerDocument;
    container.replaceChildren(OptionsPage.createStateMessage(document, "Loading options..."));

    const userConfig = await configService.get();
    const { dictionaryLanguages, ankiState } = await loadOptionsState(
      dictionaryService,
      ankiService,
      userConfig,
    );
    return new OptionsPage({
      container,
      configService,
      dictionaryService,
      ankiService,
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

  private renderStructure() {
    const sections = this.document.createElement("div");
    sections.className = cn("space-y-8 p-8") as string;
    sections.append(this.renderPageIntro());

    this.dictionaryOptions = new DictionaryOptions({
      container: sections,
      getDictionaryConfig: () => this.userConfig.dictionary,
      setDictionaryConfig: (dictionaryConfig) => this.setDictionaryConfig(dictionaryConfig),
      getDictionaryLanguages: () => this.dictionaryLanguages,
      getDeckOptions: () => this.ankiState.deckOptions,
    });

    this.ankiOptions = new AnkiOptions({
      container: sections,
      getConfig: () => this.userConfig.anki,
      setConfig: (ankiConfig) => this.setAnkiConfig(ankiConfig),
      setAnkiState: (nextAnkiState, nextAnkiConfig) =>
        this.setAnkiState(nextAnkiState, nextAnkiConfig),
      getAnkiState: () => this.ankiState,
      showStatus: (level, message) => this.footer.status.show(message, level),
      loadAnkiState: (ankiConfig) => loadAnkiState(this.ankiService, ankiConfig),
      syncTemplate: () => this.syncAnkiTemplate(),
    });

    this.element.append(sections);
    this.footer = new OptionsFooter(this.element);
    this.footer.setResetAction(() => this.reset());
  }

  private renderPageIntro() {
    const header = this.document.createElement("section");
    header.className = cn("space-y-1") as string;

    const title = this.document.createElement("h1");
    title.className = cn("text-xl font-semibold") as string;
    title.textContent = "Options";

    const text = this.document.createElement("p");
    text.className = cn("mt-1 text-sm") as string;
    text.textContent =
      "Tune dictionary sources, connect Anki, and keep note generation aligned with your workflow.";

    header.append(title, text);
    return header;
  }

  private async saveUserConfig(nextUserConfig: UserConfig, errorMessage: string) {
    if (this.sameUserConfig(nextUserConfig, this.savedUserConfig)) return;

    const task = this.saveChain.then(() => {
      if (this.sameUserConfig(nextUserConfig, this.savedUserConfig)) return;
      return this.configService.update(nextUserConfig).then(() => {
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
      anki: nextAnkiConfig ?? { ...this.userConfig.anki, noteType: nextAnkiState.noteType },
    };
    this.render();
  }

  private async syncAnkiTemplate() {
    const ankiConfig = this.userConfig.anki;
    const models = await this.ankiService.getModels();
    await (models.includes(ANKI_DEFAULT_MODEL_NAME)
      ? this.ankiService.updateModel(ANKI_DEFAULT_MODEL)
      : this.ankiService.createModel(ANKI_DEFAULT_MODEL));
    return loadAnkiState(this.ankiService, ankiConfig);
  }

  private async reset() {
    if (
      !this.document.defaultView?.confirm("Are you sure you want to reset all options to defaults?")
    ) {
      return;
    }

    await resetOptionsState(this.configService, this.dictionaryService, this.ankiService)
      .then(async ({ userConfig, ankiState }) => {
        const { dictionaryLanguages } = await loadOptionsState(
          this.dictionaryService,
          this.ankiService,
          userConfig,
        );
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
          this.dictionaryService,
          this.ankiService,
          nextUserConfig,
        );
        this.userConfig = nextUserConfig;
        this.savedUserConfig = nextUserConfig;
        this.dictionaryLanguages = dictionaryLanguages;
        this.ankiState = ankiState;
        this.render();
      })
      .catch((error) => {
        this.showLoadError(error);
      });

    return this.reloadChain;
  }

  private showLoadError(error: unknown) {
    this.container.replaceChildren(
      OptionsPage.createStateMessage(
        this.document,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  private sameUserConfig(a: UserConfig, b: UserConfig) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private static createStateMessage(doc: Document, message: string) {
    const element = doc.createElement("div");
    element.className = cn("p-4 text-sm") as string;
    element.textContent = message;
    return element;
  }
}

export type { DictionaryLanguageInfo } from "@common/model";
