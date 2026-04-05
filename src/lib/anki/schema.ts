export const LEX_FIELDS = [
  { id: "", name: "(None)" },
  { id: "word", name: "Word/Expression" },
  { id: "definition", name: "Definition" },
  { id: "examples", name: "Examples" },
  { id: "pronunciations", name: "Pronunciations" },
  { id: "provider", name: "Provider" },
  { id: "metadata", name: "Metadata" },
  { id: "audio", name: "Audio" },
  { id: "context", name: "Original Context" },
  { id: "data", name: "Full JSON Data" },
];

export const LEX_FIELD_OPTIONS: { value: string; label: string }[] = LEX_FIELDS.map((field) => ({
  value: field.id,
  label: field.name,
}));

export function guessLexFieldId(fieldName: string): string | undefined {
  const lowered = fieldName.toLowerCase();
  return LEX_FIELDS.find((lexField) => lexField.id !== "" && lowered.includes(lexField.id))?.id;
}

export function applyLexFieldGuesses(
  fields: string[],
  current: Record<string, string>,
): Record<string, string> {
  const mapped = { ...current };
  fields.forEach((field) => {
    if (mapped[field]) return;
    const guessedFieldId = guessLexFieldId(field);
    if (guessedFieldId) mapped[field] = guessedFieldId;
  });
  return mapped;
}
