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

function toSelectOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

function ensureNoteType(noteType: string, options: SelectOption[]) {
  if (options.some((option) => option.value === noteType)) return noteType;
  return options[0]?.value ?? noteType;
}

export async function loadFieldNames(ankiService: IAnkiService, noteType: string) {
  if (!noteType) return [];
  return ankiService.getModelFields(noteType);
}

export async function loadAnkiState(
  ankiService: IAnkiService,
  ankiConfig: AnkiConfig,
): Promise<AnkiState> {
  const [decks, models] = await Promise.all([
    ankiService.getDecks().catch(() => []),
    ankiService.getModels().catch(() => []),
  ]);

  const noteTypeOptions = toSelectOptions(
    models.length > 0 ? models : [ankiConfig.noteType || "Basic"],
  );
  const noteType = ensureNoteType(ankiConfig.noteType || "Basic", noteTypeOptions);

  return {
    deckOptions: toSelectOptions(decks),
    noteType,
    noteTypeOptions,
    fieldNames: await loadFieldNames(ankiService, noteType).catch(() => []),
  };
}

export function loadOptionsState(
  dictionaryService: IDictionaryService,
  ankiService: IAnkiService,
  userConfig: UserConfig,
): Promise<LoadedOptionsState> {
  return Promise.all([
    dictionaryService.getLanguages(),
    loadAnkiState(ankiService, userConfig.anki),
  ]).then(([dictionaryLanguages, ankiState]) => ({
    dictionaryLanguages,
    ankiState,
  }));
}

export function resetOptionsState(
  configService: IConfigService,
  dictionaryService: IDictionaryService,
  ankiService: IAnkiService,
) {
  return configService.reset().then((userConfig) =>
    loadOptionsState(dictionaryService, ankiService, userConfig).then(({ ankiState }) => ({
      userConfig,
      ankiState,
    })),
  );
}
