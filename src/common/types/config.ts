export interface AnkiConfig {
  connectUrl: string;
}

export interface ProviderConfig {
  provider: string;
  deck: string;
}

export type DictionaryConfig = ProviderConfig[];

export interface UserConfig {
  dictionary: DictionaryConfig;
  anki: AnkiConfig;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface AnkiState {
  deckOptions: SelectOption[];
}
