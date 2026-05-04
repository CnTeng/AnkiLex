export type StatusLevel = "success" | "error" | "info" | "warning";

export interface SelectOption {
  value: string;
  label: string;
}

export interface DictionaryRow {
  languageCode: string;
  displayName: string;
  providers: SelectOption[];
  selectedProviders: string[];
  selectedAnkiDeck: string;
}
