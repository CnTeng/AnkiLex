/**
 * Settings View - Reusable settings/options page logic
 */

import { api } from "@lib/api";
import { Button, Icon, Input, Select, type SelectElement } from "@lib/components";
import type { AnkiLexSettings } from "@lib/model";
import { Book, type IconNode, RefreshCw, RotateCcw, Save, Shield } from "lucide";
import { cn } from "tailwind-variants";

// ============================================================================
// Types & Constants
// ============================================================================

type StatusType = "success" | "error" | "info";

interface LexField {
  id: string;
  name: string;
}

interface Language {
  code: string;
  name: string;
}

const LEX_FIELDS: LexField[] = [
  { id: "", name: "(None)" },
  { id: "word", name: "Word/Expression" },
  { id: "definition", name: "Definition" },
  { id: "pronunciation", name: "Pronunciation" },
  { id: "audio", name: "Audio" },
  { id: "example", name: "Sentence Example" },
  { id: "context", name: "Original Context" },
];

const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "jp", name: "Japanese" },
];

const STATUS_COLORS: Record<StatusType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
};

// ============================================================================
// Layout Helpers
// ============================================================================

function SectionHeading(iconNode: IconNode, title: string): HTMLHeadingElement {
  const h2 = document.createElement("h2");
  h2.className = cn(
    "border-primary/10 text-info mb-6 flex items-center gap-3 border-b-2 pb-2 text-lg font-semibold",
  ) as string;
  h2.append(
    Icon({ iconNode, customAttrs: { width: 20, height: 20 } }),
    document.createTextNode(title),
  );
  return h2;
}

function FormField({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  children: HTMLElement | HTMLElement[];
}): HTMLDivElement {
  const div = document.createElement("div");
  div.className = cn("mb-6") as string;

  const lbl = document.createElement("label");
  lbl.className = cn("text-foreground mb-2 block text-sm font-medium") as string;
  lbl.textContent = label;
  if (htmlFor) lbl.htmlFor = htmlFor;
  div.append(lbl);

  if (Array.isArray(children)) {
    for (const child of children) div.append(child);
  } else {
    div.append(children);
  }

  if (help) {
    const p = document.createElement("p");
    p.className = cn("text-muted-foreground mt-1.5 text-xs") as string;
    p.textContent = help;
    div.append(p);
  }

  return div;
}

// ============================================================================
// Status Display
// ============================================================================

let statusEl: HTMLDivElement | null = null;

function showStatus(message: string, type: StatusType): void {
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove(...Object.values(STATUS_COLORS));
  statusEl.classList.add(STATUS_COLORS[type]);

  statusEl.classList.remove("opacity-0", "translate-y-2");
  statusEl.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    statusEl?.classList.remove("opacity-100", "translate-y-0");
    statusEl?.classList.add("opacity-0", "translate-y-2");
  }, 3000);
}

// ============================================================================
// Select Options Helpers
// ============================================================================

function populateSelect(
  select: HTMLSelectElement,
  items: string[],
  currentValue: string,
  fallback: string,
): void {
  select.innerHTML = "";

  if (items.length > 0) {
    for (const item of items) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      option.selected = item === currentValue;
      select.append(option);
    }
  } else {
    const option = document.createElement("option");
    option.value = fallback;
    option.textContent = fallback;
    select.append(option);
  }
}

// ============================================================================
// Field Mapping
// ============================================================================

let fieldMappingContainer: HTMLDivElement;
let fieldMappingList: HTMLDivElement;

function createFieldRow(field: string, currentMappings: Record<string, string>): HTMLDivElement {
  const row = document.createElement("div");
  row.className = cn("flex items-center gap-4 py-1") as string;

  const label = document.createElement("label");
  label.textContent = field;
  label.className = cn("text-foreground w-36 shrink-0 text-right text-sm font-medium") as string;

  const selectEl = Select({
    options: LEX_FIELDS.map((f) => ({ value: f.id, label: f.name })),
    value: currentMappings[field] || "",
    className: "field-mapping-select",
  });
  selectEl.select.dataset.field = field;
  selectEl.select.classList.add("field-mapping-select");

  row.append(label, selectEl);

  return row;
}

async function loadFieldMappings(
  noteType: string,
  currentMappings: Record<string, string> = {},
): Promise<void> {
  if (!noteType) return;

  try {
    const response = await api.anki.getFields(noteType);

    if (!response.fields?.length) {
      fieldMappingContainer.style.display = "none";
      return;
    }

    fieldMappingContainer.style.display = "block";
    fieldMappingList.innerHTML = "";

    for (const field of response.fields) {
      fieldMappingList.append(createFieldRow(field, currentMappings));
    }
  } catch (error) {
    console.warn("Failed to load fields", error);
  }
}

// ============================================================================
// Dictionary List
// ============================================================================

let dictionaryList: HTMLDivElement;

function createLanguageRow(
  lang: Language,
  providers: Array<{ id: string; name: string }>,
  currentValue: string,
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = cn("flex items-center gap-4 py-1") as string;

  const label = document.createElement("label");
  label.textContent = lang.name;
  label.className = cn("text-foreground w-24 shrink-0 text-sm font-medium") as string;

  const selectEl = Select({
    options: [
      { value: "", label: "(None)" },
      ...providers.map((p) => ({ value: p.id, label: p.name })),
    ],
    value: currentValue || "",
    className: "dictionary-select",
  });
  selectEl.select.dataset.lang = lang.code;
  selectEl.select.classList.add("dictionary-select");

  row.append(label);
  row.append(selectEl);

  return row;
}

async function loadDictionaries(languageDictionaries: Record<string, string>): Promise<void> {
  try {
    const response = await api.dictionary.getProviders();
    if (!response.providers) return;

    dictionaryList.innerHTML = "";

    for (const lang of LANGUAGES) {
      dictionaryList.append(
        createLanguageRow(lang, response.providers, languageDictionaries[lang.code] || ""),
      );
    }
  } catch (error) {
    console.warn("Failed to load dictionaries", error);
  }
}

// ============================================================================
// Anki Connection
// ============================================================================

let deckSelect: SelectElement;
let noteTypeSelect: SelectElement;

async function refreshAnki(): Promise<void> {
  showStatus("Connecting to Anki...", "info");

  try {
    const decksResponse = await api.anki.getDecks();
    const currentDeck = deckSelect.select.value;
    const decks = Array.isArray(decksResponse) ? decksResponse : (decksResponse?.decks ?? []);
    populateSelect(deckSelect.select, decks, currentDeck, "Default");

    const noteTypeResponse = await api.anki.getNoteTypes();
    const currentNoteType = noteTypeSelect.select.value;
    const noteTypes = Array.isArray(noteTypeResponse)
      ? noteTypeResponse
      : (noteTypeResponse?.noteTypes ?? []);
    populateSelect(noteTypeSelect.select, noteTypes, currentNoteType, "Basic");

    if (!noteTypes.includes(currentNoteType) && noteTypes.length > 0) {
      noteTypeSelect.select.value = noteTypes[0];
    }

    showStatus("Anki connection successful!", "success");
    loadFieldMappings(noteTypeSelect.select.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showStatus(`Failed to connect to Anki: ${message}`, "error");
  }
}

// ============================================================================
// Form Population
// ============================================================================

let ankiUrlInput: HTMLInputElement;

function populateForm(settings: AnkiLexSettings): void {
  ankiUrlInput.value = settings.ankiConnectUrl;

  populateSelect(
    deckSelect.select,
    [settings.ankiDefaultDeck],
    settings.ankiDefaultDeck,
    "Default",
  );

  populateSelect(
    noteTypeSelect.select,
    [settings.ankiDefaultNoteType],
    settings.ankiDefaultNoteType,
    "Basic",
  );

  if (settings.ankiDefaultNoteType) {
    loadFieldMappings(settings.ankiDefaultNoteType, settings.ankiFieldMap);
  } else {
    refreshAnki();
  }
}

// ============================================================================
// Settings Save/Reset
// ============================================================================

function collectDictionarySettings(): Record<string, string> {
  const result: Record<string, string> = {};
  document.querySelectorAll<HTMLSelectElement>(".dictionary-select").forEach((select) => {
    if (select.value && select.dataset.lang) {
      result[select.dataset.lang] = select.value;
    }
  });
  return result;
}

function collectFieldMappings(): Record<string, string> {
  const result: Record<string, string> = {};
  document.querySelectorAll<HTMLSelectElement>(".field-mapping-select").forEach((select) => {
    if (select.value && select.dataset.field) {
      result[select.dataset.field] = select.value;
    }
  });
  return result;
}

async function saveSettings(): Promise<void> {
  const settings: Partial<AnkiLexSettings> = {
    ankiConnectUrl: ankiUrlInput.value,
    ankiDefaultDeck: deckSelect.select.value,
    ankiDefaultNoteType: noteTypeSelect.select.value,
    dictionaryProviders: collectDictionarySettings(),
    ankiFieldMap: collectFieldMappings(),
  };

  try {
    await api.settings.update(settings);
    showStatus("Settings saved successfully!", "success");
  } catch (error) {
    console.error("Failed to save settings", error);
    showStatus("Error saving settings.", "error");
  }
}

async function resetSettings(): Promise<void> {
  if (!confirm("Are you sure you want to reset all settings to defaults?")) {
    return;
  }

  const settings = await api.settings.reset();
  populateForm(settings);
  loadDictionaries(settings.dictionaryProviders);
  showStatus("Settings reset to defaults.", "success");
}

// ============================================================================
// Build Page
// ============================================================================

function buildPage(): HTMLElement {
  const root = document.createElement("div");
  root.className = cn(
    "border-border bg-background mx-auto my-10 max-w-4xl overflow-hidden rounded-xl border shadow-xl",
  ) as string;

  // Header
  const header = document.createElement("header");
  header.className = cn("border-border bg-background border-b px-8 py-6") as string;
  const h1 = document.createElement("h1");
  h1.className = cn("text-foreground text-2xl font-bold tracking-tight") as string;
  h1.textContent = "AnkiLex Settings";
  header.append(h1);

  // Content
  const content = document.createElement("div");
  content.className = cn("space-y-10 p-8") as string;

  // -- Dictionary Section --
  const dictSection = document.createElement("section");
  dictSection.append(SectionHeading(Book, "Dictionary"));

  dictionaryList = document.createElement("div");
  dictionaryList.className = cn(
    "border-border bg-muted max-h-60 space-y-2 overflow-y-auto rounded-lg border p-3",
  ) as string;

  dictSection.append(
    FormField({
      label: "Enabled Dictionaries",
      help: "Select which dictionaries to use for lookups.",
      children: dictionaryList,
    }),
  );

  // -- Anki Section --
  const ankiSection = document.createElement("section");
  ankiSection.append(SectionHeading(Shield, "Anki"));

  // AnkiConnect URL
  ankiUrlInput = Input({
    id: "anki-url",
    placeholder: "http://127.0.0.1:8765",
  });
  ankiSection.append(
    FormField({
      label: "AnkiConnect URL",
      htmlFor: "anki-url",
      help: "Requires AnkiConnect add-on to be installed and running in Anki.",
      children: ankiUrlInput,
    }),
  );

  // Default Deck (select + refresh button)
  deckSelect = Select({
    id: "default-deck",
    options: [{ value: "Default", label: "Default" }],
  });

  const refreshBtn = Button({
    variant: "outline",
    size: "icon",
    icon: Icon({ iconNode: RefreshCw, customAttrs: { width: 16, height: 16 } }),
    title: "Refresh Decks/Models",
    onClick: () => refreshAnki(),
  });
  // Match height with h-10 selects
  refreshBtn.classList.add("h-10", "w-10");

  const deckRow = document.createElement("div");
  deckRow.className = cn("flex gap-3") as string;
  deckRow.append(deckSelect, refreshBtn);

  ankiSection.append(
    FormField({
      label: "Default Deck",
      htmlFor: "default-deck",
      children: deckRow,
    }),
  );

  // Default Note Type
  noteTypeSelect = Select({
    id: "default-note-type",
    options: [{ value: "Basic", label: "Basic" }],
    onChange: (value) => loadFieldMappings(value),
  });
  ankiSection.append(
    FormField({
      label: "Default Note Type",
      htmlFor: "default-note-type",
      children: noteTypeSelect,
    }),
  );

  // Field Mapping
  fieldMappingContainer = document.createElement("div");
  fieldMappingContainer.className = cn("mb-6 hidden") as string;

  const fieldLabel = document.createElement("label");
  fieldLabel.className = cn("text-foreground mb-2 block text-sm font-medium") as string;
  fieldLabel.textContent = "Field Mapping";

  fieldMappingList = document.createElement("div");
  fieldMappingList.className = cn(
    "border-border bg-muted space-y-3 rounded-lg border p-4",
  ) as string;

  fieldMappingContainer.append(fieldLabel, fieldMappingList);
  ankiSection.append(fieldMappingContainer);

  content.append(dictSection, ankiSection);

  // Footer
  const footer = document.createElement("div");
  footer.className = cn(
    "border-border bg-muted flex items-center justify-between border-t px-8 py-6",
  ) as string;

  const resetBtn = Button({
    variant: "destructive-ghost",
    size: "default",
    icon: Icon({ iconNode: RotateCcw, customAttrs: { width: 16, height: 16 } }),
    label: "Reset Defaults",
    title: "Reset all settings to default",
    onClick: () => resetSettings(),
  });

  statusEl = document.createElement("div");
  statusEl.className = cn(
    "text-muted-foreground translate-y-2 text-sm font-medium opacity-0 transition-all",
  ) as string;

  const saveBtn = Button({
    variant: "primary",
    size: "default",
    icon: Icon({ iconNode: Save, customAttrs: { width: 16, height: 16 } }),
    label: "Save Changes",
    onClick: () => saveSettings(),
  });

  const rightGroup = document.createElement("div");
  rightGroup.className = cn("flex items-center gap-4") as string;
  rightGroup.append(statusEl, saveBtn);

  footer.append(resetBtn, rightGroup);

  root.append(header, content, footer);

  return root;
}

// ============================================================================
// Public API
// ============================================================================

export async function initSettingsView(): Promise<void> {
  const page = buildPage();
  document.body.append(page);

  // Load current settings
  const settings = await api.settings.get();
  populateForm(settings);

  // Load available dictionaries
  try {
    await loadDictionaries(settings.dictionaryProviders);
  } catch (e) {
    console.warn("Failed to load dictionaries", e);
  }
}
