import type {
  AnkiConfig,
  AnkiState,
  DictionaryLanguageInfo,
  PlatformServices,
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

export async function loadFieldNames(services: PlatformServices, noteType: string) {
  if (!noteType) return [];
  return services.anki.getModelFields(noteType);
}

export async function loadAnkiState(
  services: PlatformServices,
  ankiConfig: AnkiConfig,
): Promise<AnkiState> {
  const [decks, models] = await Promise.all([
    services.anki.getDecks().catch(() => []),
    services.anki.getModels().catch(() => []),
  ]);

  const noteTypeOptions = toSelectOptions(
    models.length > 0 ? models : [ankiConfig.noteType || "Basic"],
  );
  const noteType = ensureNoteType(ankiConfig.noteType || "Basic", noteTypeOptions);

  return {
    deckOptions: toSelectOptions(decks),
    noteType,
    noteTypeOptions,
    fieldNames: await loadFieldNames(services, noteType).catch(() => []),
  };
}

export function loadOptionsState(
  services: PlatformServices,
  userConfig: UserConfig,
): Promise<LoadedOptionsState> {
  return Promise.all([
    services.dictionary.getLanguages(),
    loadAnkiState(services, userConfig.anki),
  ]).then(([dictionaryLanguages, ankiState]) => ({
    dictionaryLanguages,
    ankiState,
  }));
}

export function resetOptionsState(services: PlatformServices) {
  return services.config.reset().then((userConfig) =>
    loadOptionsState(services, userConfig).then(({ ankiState }) => ({
      userConfig,
      ankiState,
    })),
  );
}
