import type { UserSettings } from "@lib/model";
import { Button, Icon, Select } from "@lib/ui/components";
import { Book, Plus, X } from "lucide";
import { cn } from "tailwind-variants";
import { createSectionHeading } from "./elements";
import type { DictionaryRow, SelectOption } from "./types";

export interface DictionarySectionResult {
  element: HTMLElement;
  render: (rows: DictionaryRow[]) => void;
  setDeckOptions: (options: SelectOption[]) => void;
}

function upsertLanguageSetting(
  draft: UserSettings,
  languageCode: string,
  provider: string,
  deck: string,
) {
  const current = draft.languages[languageCode] ?? { providers: [], deck: "" };
  draft.languages[languageCode] = {
    providers:
      provider && !current.providers.includes(provider)
        ? [...current.providers, provider]
        : current.providers,
    deck,
  };
}

function getLanguageSetting(draft: UserSettings, languageCode: string) {
  return draft.languages[languageCode] ?? { providers: [], deck: "" };
}

function setLanguageSetting(
  draft: UserSettings,
  languageCode: string,
  setting: { providers?: string[]; deck?: string },
) {
  const current = getLanguageSetting(draft, languageCode);
  draft.languages[languageCode] = {
    providers: setting.providers ?? current.providers,
    deck: setting.deck ?? current.deck,
  };
}

function removeLanguageSetting(draft: UserSettings, languageCode: string) {
  delete draft.languages[languageCode];
}

function removeLanguageProvider(draft: UserSettings, languageCode: string, provider: string) {
  const current = getLanguageSetting(draft, languageCode);
  setLanguageSetting(draft, languageCode, {
    providers: current.providers.filter((currentProvider) => currentProvider !== provider),
  });
}

export function DictionarySection(doc: Document, draft: UserSettings): DictionarySectionResult {
  const section = doc.createElement("section");
  section.append(createSectionHeading(doc, Book, "Languages"));

  const content = doc.createElement("div");
  content.className = cn("space-y-3") as string;

  const composerGrid = doc.createElement("div");
  composerGrid.className = cn("grid items-end gap-2 lg:grid-cols-4") as string;

  const languageSelect = Select({ doc, options: [] });
  const providerSelect = Select({
    doc,
    options: [{ value: "", label: "Select a language first" }],
  });
  const deckSelect = Select({
    doc,
    options: [{ value: "", label: "No deck" }],
  });
  const addButton = Button({
    doc,
    label: "Add",
    icon: Icon({
      doc,
      iconNode: Plus,
      customAttrs: { width: 14, height: 14 },
    }),
    variant: "outline",
    size: "default",
  });
  addButton.classList.add("w-full", "lg:min-w-28");

  const configBody = doc.createElement("div");
  configBody.className = cn(
    "divide-border border-border max-h-72 divide-y overflow-y-auto rounded-lg border",
  ) as string;

  function createField(label: string, control: HTMLElement) {
    const field = doc.createElement("div");
    field.className = cn("space-y-1") as string;

    const labelEl = doc.createElement("p");
    labelEl.className = cn(
      "text-muted-foreground text-[11px] font-medium tracking-wide uppercase",
    ) as string;
    labelEl.textContent = label;

    field.append(labelEl, control);
    return field;
  }

  let rows: DictionaryRow[] = [];
  let deckOptions: SelectOption[] = [{ value: "", label: "No deck" }];

  function updateComposerOptions() {
    const languageOptions = rows.map((row) => ({
      value: row.languageCode,
      label: row.displayName,
    }));
    languageSelect.setOptions(languageOptions);

    const selectedLanguage = languageSelect.select.value || languageOptions[0]?.value || "";
    languageSelect.select.value = selectedLanguage;

    const selectedRow = rows.find((row) => row.languageCode === selectedLanguage);
    providerSelect.setOptions(
      selectedRow?.providers.filter((option) => option.value) ?? [
        { value: "", label: "No providers available" },
      ],
    );

    const currentDeckOptions =
      deckOptions.length > 0 ? deckOptions : [{ value: "", label: "No deck" }];
    deckSelect.setOptions(currentDeckOptions);

    deckSelect.select.value = getLanguageSetting(draft, selectedLanguage).deck;
  }

  function renderCurrentSettings() {
    const items = rows
      .filter((row) => {
        const setting = getLanguageSetting(draft, row.languageCode);
        return setting && (setting.providers.length > 0 || setting.deck);
      })
      .map((row) => {
        const setting = getLanguageSetting(draft, row.languageCode);
        const item = doc.createElement("div");
        item.className = cn(
          "flex flex-col gap-2 px-3 py-2.5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-3",
        ) as string;

        const languageName = doc.createElement("div");
        languageName.className = cn(
          "text-foreground truncate text-sm font-medium lg:col-span-3",
        ) as string;
        languageName.textContent = row.displayName;

        const deckText = doc.createElement("div");
        deckText.className = cn(
          "text-muted-foreground bg-muted w-fit rounded px-2 py-1 text-xs lg:col-span-2",
        ) as string;
        deckText.textContent = setting.deck || "(No deck)";

        const removeLanguageButton = Button({
          doc,
          title: "Remove language setting",
          icon: Icon({
            doc,
            iconNode: X,
            customAttrs: { width: 14, height: 14 },
          }),
          variant: "outline",
          size: "icon-xs",
          onClick: () => {
            removeLanguageSetting(draft, row.languageCode);
            renderCurrentSettings();
            updateComposerOptions();
          },
        });

        const chips = doc.createElement("div");
        chips.className = cn("flex flex-wrap gap-1.5 lg:col-span-6") as string;

        setting.providers.forEach((providerId) => {
          const providerInfo = row.providers.find((option) => option.value === providerId);
          const chip = doc.createElement("div");
          chip.className = cn(
            "bg-muted text-foreground flex items-center gap-1 rounded-md px-2 py-1",
          ) as string;

          const chipText = doc.createElement("span");
          chipText.className = cn("text-foreground text-xs") as string;
          chipText.textContent = providerInfo?.label || providerId;

          const removeProviderButton = Button({
            doc,
            title: "Remove provider",
            icon: Icon({
              doc,
              iconNode: X,
              customAttrs: { width: 12, height: 12 },
            }),
            variant: "ghost",
            size: "icon-xs",
            onClick: () => {
              removeLanguageProvider(draft, row.languageCode, providerId);
              renderCurrentSettings();
            },
          });

          chip.append(chipText, removeProviderButton);
          chips.append(chip);
        });

        if (setting.providers.length === 0) {
          const empty = doc.createElement("p");
          empty.className = cn("text-muted-foreground text-xs") as string;
          empty.textContent = "No providers selected.";
          chips.append(empty);
        }

        removeLanguageButton.classList.add("lg:justify-self-end");
        item.append(languageName, deckText, chips, removeLanguageButton);
        return item;
      });

    if (items.length === 0) {
      const empty = doc.createElement("p");
      empty.className = cn("text-muted-foreground px-3 py-2.5 text-xs") as string;
      empty.textContent = "No language settings yet.";
      configBody.replaceChildren(empty);
      return;
    }

    configBody.replaceChildren(...items);
  }

  languageSelect.select.addEventListener("change", () => {
    const selectedLanguage = languageSelect.select.value;
    const selectedRow = rows.find((row) => row.languageCode === selectedLanguage);
    providerSelect.setOptions(
      selectedRow?.providers.filter((option) => option.value) ?? [
        { value: "", label: "No providers available" },
      ],
    );

    deckSelect.select.value = getLanguageSetting(draft, selectedLanguage).deck;
  });

  addButton.addEventListener("click", () => {
    const languageCode = languageSelect.select.value;
    const provider = providerSelect.select.value;
    const deck = deckSelect.select.value;
    if (!languageCode || !provider) return;

    upsertLanguageSetting(draft, languageCode, provider, deck);
    renderCurrentSettings();
    updateComposerOptions();
  });

  composerGrid.append(
    createField("Language", languageSelect as HTMLElement),
    createField("Provider", providerSelect as HTMLElement),
    createField("Deck", deckSelect as HTMLElement),
    createField(" ", addButton),
  );

  content.append(composerGrid, configBody);
  section.append(content);

  function render(nextRows: DictionaryRow[]) {
    rows = nextRows;
    updateComposerOptions();
    renderCurrentSettings();
  }

  function setDeckOptions(options: SelectOption[]) {
    deckOptions = [{ value: "", label: "No deck" }, ...options.filter((option) => option.value)];
    updateComposerOptions();
  }

  return { element: section, render, setDeckOptions };
}
