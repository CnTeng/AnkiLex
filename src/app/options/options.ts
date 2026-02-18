/**
 * Options Page Logic
 */

import { api } from "@lib/api";
import type { AnkiLexSettings } from "@lib/model";
import { theme } from "@lib/theme";
import {
  Book,
  Check,
  ChevronDown,
  createElement,
  Layout,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
} from "lucide";
import { twMerge } from "tailwind-merge";

class AnkiLexOptions {
  constructor() {
    this.init();
  }

  async init() {
    await theme.init();
    console.log("AnkiLex Options initializing");

    this.initIcons();

    // Load current settings
    const settings = await api.settings.get();
    this.populateForm(settings);

    // Load available dictionaries
    try {
      await this.loadDictionaries(settings.dictionaryProviders);
    } catch (e) {
      console.warn("Failed to load dictionaries", e);
    }

    // Add event listeners
    document.getElementById("save")?.addEventListener("click", () => this.saveSettings());
    document.getElementById("reset")?.addEventListener("click", () => this.resetSettings());
    document.getElementById("refresh-anki")?.addEventListener("click", () => this.refreshAnki());

    document.getElementById("default-note-type")?.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      this.loadFieldMappings(target.value);
    });
  }

  private initIcons() {
    this.renderIcons();
    document.querySelectorAll<HTMLSelectElement>("select.select-field").forEach((select) => {
      this.decorateSelect(select);
    });
  }

  private renderIcons() {
    const iconMap = {
      book: Book,
      check: Check,
      layout: Layout,
      refresh: RefreshCw,
      reset: RotateCcw,
      save: Save,
      shield: Shield,
    } as const;

    document.querySelectorAll<HTMLElement>("[data-icon]").forEach((el) => {
      const name = el.dataset.icon as keyof typeof iconMap | undefined;
      const Icon = name ? iconMap[name] : undefined;
      if (!Icon) return;

      const size = Number(el.dataset.iconSize ?? 16);
      el.replaceChildren(createElement(Icon, { width: size, height: size }));
    });
  }

  private decorateSelect(select: HTMLSelectElement): HTMLDivElement {
    if (select.parentElement?.classList.contains("select-wrapper")) {
      return select.parentElement as HTMLDivElement;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "select-wrapper";

    select.classList.add("select-field");

    const icon = createElement(ChevronDown, { width: 16, height: 16 });
    icon.classList.add("select-icon");

    select.parentElement?.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    wrapper.appendChild(icon);

    return wrapper;
  }

  populateForm(settings: AnkiLexSettings) {
    (document.getElementById("auto-lookup") as HTMLInputElement).checked = settings.autoLookup;
    (document.getElementById("anki-url") as HTMLInputElement).value = settings.ankiConnectUrl;
    (document.getElementById("popup-width") as HTMLInputElement).value =
      settings.popupWidth.toString();
    (document.getElementById("popup-height") as HTMLInputElement).value =
      settings.popupHeight.toString();
    (document.getElementById("theme") as HTMLSelectElement).value = settings.theme;

    // Default Deck and Note Type will be populated after refreshing Anki
    const deckSelect = document.getElementById("default-deck") as HTMLSelectElement;
    deckSelect.innerHTML = `<option value="${settings.ankiDefaultDeck}">${settings.ankiDefaultDeck}</option>`;

    const noteTypeSelect = document.getElementById("default-note-type") as HTMLSelectElement;
    noteTypeSelect.innerHTML = `<option value="${settings.ankiDefaultNoteType}">${settings.ankiDefaultNoteType}</option>`;

    if (settings.ankiDefaultNoteType) {
      this.loadFieldMappings(settings.ankiDefaultNoteType, settings.ankiFieldMap);
    } else {
      this.refreshAnki();
    }
  }

  async loadFieldMappings(noteType: string, currentMappings: Record<string, string> = {}) {
    if (!noteType) return;

    try {
      const response = await api.anki.getFields(noteType);
      const container = document.getElementById("field-mapping-container");
      const list = document.getElementById("field-mapping-list");
      if (!container || !list) return;

      if (!response.fields?.length) {
        container.style.display = "none";
        return;
      }

      container.style.display = "block";
      list.innerHTML = "";

      const lexFields = [
        { id: "", name: "(None)" },
        { id: "word", name: "Word/Expression" },
        { id: "definition", name: "Definition" },
        { id: "pronunciation", name: "Pronunciation" },
        { id: "audio", name: "Audio" },
        { id: "example", name: "Sentence Example" },
        { id: "context", name: "Original Context" },
      ];

      response.fields.forEach((field: string) => {
        const fieldRow = document.createElement("div");
        fieldRow.className = "flex items-center gap-4 py-1";

        const label = document.createElement("label");
        label.textContent = field;
        label.className = "w-36 text-sm font-medium text-gray-700 text-right shrink-0";

        const select = document.createElement("select");
        select.dataset.field = field;
        select.className = twMerge(
          "select-field flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none",
        );

        lexFields.forEach((lexField) => {
          const option = document.createElement("option");
          option.value = lexField.id;
          option.textContent = lexField.name;
          if (currentMappings[field] === lexField.id) {
            option.selected = true;
          }
          select.appendChild(option);
        });

        fieldRow.appendChild(label);
        fieldRow.appendChild(this.decorateSelect(select));
        list.appendChild(fieldRow);
      });
    } catch (error) {
      console.warn("Failed to load fields", error);
    }
  }

  async loadDictionaries(languageDictionaries: Record<string, string>) {
    const response = await api.dictionary.getProviders();
    const list = document.getElementById("dictionary-list");
    if (!list || !response.providers) return;

    list.innerHTML = "";

    // Define supported languages (expand this list as needed)
    const languages = [
      { code: "en", name: "English" },
      { code: "zh", name: "Chinese" },
      { code: "jp", name: "Japanese" },
      // Add more languages here
    ];

    languages.forEach((lang) => {
      const langRow = document.createElement("div");
      langRow.className = "flex items-center gap-4 py-1";

      const label = document.createElement("label");
      label.textContent = lang.name;
      label.className = "w-24 text-sm font-medium text-gray-700 shrink-0";

      const select = document.createElement("select");
      select.className = twMerge(
        "dictionary-select select-field flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none",
      );
      select.dataset.lang = lang.code;

      // Add "None" option
      const noneOption = document.createElement("option");
      noneOption.value = "";
      noneOption.textContent = "(None)";
      select.appendChild(noneOption);

      // Populate available dictionaries
      response.providers.forEach((dict: { id: string; name: string }) => {
        const option = document.createElement("option");
        option.value = dict.id;
        option.textContent = dict.name;

        // Currently simple logic: if a dictionary is available, show it for all langs
        // In future, dictionaries should declare supported languages
        select.appendChild(option);
      });

      // Set selected value
      if (languageDictionaries[lang.code]) {
        select.value = languageDictionaries[lang.code];
      }

      langRow.appendChild(label);
      langRow.appendChild(this.decorateSelect(select));
      list.appendChild(langRow);
    });
  }

  async refreshAnki() {
    this.showStatus("Connecting to Anki...", "info");

    try {
      const decksResponse = await api.anki.getDecks();
      const deckSelect = document.getElementById("default-deck") as HTMLSelectElement;
      const currentDeck = deckSelect.value;
      deckSelect.innerHTML = "";

      const decks = Array.isArray(decksResponse) ? decksResponse : decksResponse?.decks;
      if (Array.isArray(decks) && decks.length > 0) {
        decks.forEach((deck) => {
          const option = document.createElement("option");
          option.value = deck;
          option.textContent = deck;
          if (deck === currentDeck) option.selected = true;
          deckSelect.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.value = "Default";
        option.textContent = "Default";
        deckSelect.appendChild(option);
      }

      const noteTypeResponse = await api.anki.getNoteTypes();
      const noteTypeSelect = document.getElementById("default-note-type") as HTMLSelectElement;
      const currentNoteType = noteTypeSelect.value;
      noteTypeSelect.innerHTML = "";

      const noteTypes = Array.isArray(noteTypeResponse)
        ? noteTypeResponse
        : noteTypeResponse.noteTypes;
      if (Array.isArray(noteTypes) && noteTypes.length > 0) {
        noteTypes.forEach((type) => {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = type;
          if (type === currentNoteType) option.selected = true;
          noteTypeSelect.appendChild(option);
        });
      } else {
        const option = document.createElement("option");
        option.value = "Basic";
        option.textContent = "Basic";
        noteTypeSelect.appendChild(option);
      }

      if (!noteTypes.includes(currentNoteType) && noteTypes.length > 0) {
        noteTypeSelect.value = noteTypes[0];
      }

      this.showStatus("Anki connection successful!", "success");
      this.loadFieldMappings(noteTypeSelect.value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showStatus(`Failed to connect to Anki: ${message}`, "error");
    }
  }

  async saveSettings() {
    const languageDictionaries: Record<string, string> = {};
    document.querySelectorAll(".dictionary-select").forEach((el) => {
      const select = el as HTMLSelectElement;
      if (select.value && select.dataset.lang) {
        languageDictionaries[select.dataset.lang] = select.value;
      }
    });

    const settings: Partial<AnkiLexSettings> = {
      autoLookup: (document.getElementById("auto-lookup") as HTMLInputElement).checked,
      ankiConnectUrl: (document.getElementById("anki-url") as HTMLInputElement).value,
      ankiDefaultDeck: (document.getElementById("default-deck") as HTMLSelectElement).value,
      ankiDefaultNoteType: (document.getElementById("default-note-type") as HTMLSelectElement)
        .value,
      popupWidth: parseInt((document.getElementById("popup-width") as HTMLInputElement).value, 10),
      popupHeight: parseInt(
        (document.getElementById("popup-height") as HTMLInputElement).value,
        10,
      ),
      theme: (document.getElementById("theme") as HTMLSelectElement).value as any,
      dictionaryProviders: languageDictionaries,
      ankiFieldMap: {},
    };

    document.querySelectorAll(".field-mapping-select").forEach((el) => {
      const select = el as HTMLSelectElement;
      if (select.value && select.dataset.field) {
        settings.ankiFieldMap![select.dataset.field] = select.value;
      }
    });

    try {
      await api.settings.update(settings);
      this.showStatus("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save settings", error);
      this.showStatus("Error saving settings.", "error");
    }
  }

  async resetSettings() {
    if (!confirm("Are you sure you want to reset all settings to defaults?")) {
      return;
    }

    const settings = await api.settings.reset();
    this.populateForm(settings);
    this.loadDictionaries(settings.dictionaryProviders);
    this.showStatus("Settings reset to defaults.", "success");
  }

  showStatus(message: string, type: "success" | "error" | "info") {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = message;

      // Reset classes
      status.classList.remove("text-green-600", "text-red-600", "text-blue-600");

      // Add color
      if (type === "success") status.classList.add("text-green-600");
      if (type === "error") status.classList.add("text-red-600");
      if (type === "info") status.classList.add("text-blue-600");

      // Show
      status.classList.remove("opacity-0", "translate-y-2");
      status.classList.add("opacity-100", "translate-y-0");

      setTimeout(() => {
        // Hide
        status.classList.remove("opacity-100", "translate-y-0");
        status.classList.add("opacity-0", "translate-y-2");
      }, 3000);
    }
  }
}

new AnkiLexOptions();
