export type StatusLevel = "success" | "error" | "info";

export interface SelectOption {
  value: string;
  label: string;
}

export interface DictionaryRow {
  languageCode: string;
  displayName: string;
  providers: SelectOption[];
  selectedProvider: string;
}

export interface FieldMappingRow {
  fieldName: string;
  options: SelectOption[];
  selectedValue: string;
}
