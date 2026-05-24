import type {
  AnkiConfig,
  AnkiState,
  DictionaryLanguageInfo,
  IAnkiService,
  IConfigService,
  IDictionaryService,
  SelectOption,
  UserConfig,
} from "@common/model";

export interface LoadedOptionsState {
  dictionaryLanguages: DictionaryLanguageInfo[];
  ankiState: AnkiState;
}

class OptionsStateLoader {
  private readonly dictionaryService?: IDictionaryService;
  private readonly ankiService: IAnkiService;

  constructor({
    dictionaryService,
    ankiService,
  }: {
    dictionaryService?: IDictionaryService;
    ankiService: IAnkiService;
  }) {
    this.dictionaryService = dictionaryService;
    this.ankiService = ankiService;
  }

  async loadAnkiState(ankiConfig: AnkiConfig): Promise<AnkiState> {
    const [decks, models] = await Promise.all([
      this.ankiService.getDecks().catch(() => []),
      this.ankiService.getModels().catch(() => []),
    ]);

    const noteTypeOptions = this.toSelectOptions(
      models.length > 0 ? models : [ankiConfig.noteType || "Basic"],
    );
    const noteType = this.ensureNoteType(ankiConfig.noteType || "Basic", noteTypeOptions);

    return {
      deckOptions: this.toSelectOptions(decks),
      noteType,
      noteTypeOptions,
    };
  }

  async loadOptionsState(userConfig: UserConfig): Promise<LoadedOptionsState> {
    if (!this.dictionaryService) {
      throw new Error("Dictionary service is required to load options state");
    }

    const [dictionaryLanguages, ankiState] = await Promise.all([
      this.dictionaryService.getLanguages(),
      this.loadAnkiState(userConfig.anki),
    ]);

    return {
      dictionaryLanguages,
      ankiState,
    };
  }

  private toSelectOptions(values: string[]): SelectOption[] {
    return values.map((value) => ({ value, label: value }));
  }

  private ensureNoteType(noteType: string, options: SelectOption[]) {
    if (options.some((option) => option.value === noteType)) return noteType;
    return options[0]?.value ?? noteType;
  }
}

export async function loadAnkiState(
  ankiService: IAnkiService,
  ankiConfig: AnkiConfig,
): Promise<AnkiState> {
  return new OptionsStateLoader({ ankiService }).loadAnkiState(ankiConfig);
}

export function loadOptionsState(
  dictionaryService: IDictionaryService,
  ankiService: IAnkiService,
  userConfig: UserConfig,
): Promise<LoadedOptionsState> {
  return new OptionsStateLoader({ dictionaryService, ankiService }).loadOptionsState(userConfig);
}

export function resetOptionsState(
  configService: IConfigService,
  dictionaryService: IDictionaryService,
  ankiService: IAnkiService,
) {
  const loader = new OptionsStateLoader({ dictionaryService, ankiService });
  return configService.reset().then((userConfig) =>
    loader.loadOptionsState(userConfig).then(({ ankiState }) => ({
      userConfig,
      ankiState,
    })),
  );
}
