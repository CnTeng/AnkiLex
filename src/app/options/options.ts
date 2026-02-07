/**
 * Options Page Logic
 */

import type { AnkiLexSettings } from "../../lib/model";

class AnkiLexOptions {
  constructor() {
    this.init();
  }

  async init() {
    console.log("AnkiLex Options initializing");

    // Load current settings
    const settings = await this.getSettings();
    this.populateForm(settings);

    // Load available dictionaries
    try {
      await this.loadDictionaries(settings.languageDictionaries);
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

  async getSettings(): Promise<AnkiLexSettings> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "settings-get" }, (response) => {
        resolve(response.settings);
      });
    });
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
    deckSelect.innerHTML = `<option value="${settings.defaultDeck}">${settings.defaultDeck}</option>`;

    const noteTypeSelect = document.getElementById("default-note-type") as HTMLSelectElement;
    noteTypeSelect.innerHTML = `<option value="${settings.defaultNoteType}">${settings.defaultNoteType}</option>`;

    if (settings.defaultNoteType) {
      // Use existing mappings if available, otherwise just note type triggers refresh
      this.loadFieldMappings(settings.defaultNoteType, settings.fieldMappings);
    } else {
      // If no note type is set (e.g. first run), try to get Anki data to populate list
      // but don't force a specific mapping load yet.
      this.refreshAnki().then(() => {
        // After refreshing, if we have a note type now, load mappings
        const noteTypeSelect = document.getElementById("default-note-type") as HTMLSelectElement;
        if (noteTypeSelect && noteTypeSelect.value) {
          // If we found a note type from Anki, use saved mappings or empty
          this.loadFieldMappings(noteTypeSelect.value, settings.fieldMappings);
        }
      });
    }
  }

  async loadFieldMappings(noteType: string, currentMappings: Record<string, string> = {}) {
    if (!noteType) return;

    chrome.runtime.sendMessage(
      { action: "anki-get-fields", data: { modelName: noteType } },
      (response) => {
        const container = document.getElementById("field-mapping-container");
        const list = document.getElementById("field-mapping-list");
        if (!container || !list) return;

        if (response.error || !response.fields) {
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
          fieldRow.className = "field-mapping-row";
          fieldRow.style.display = "flex";
          fieldRow.style.alignItems = "center";
          fieldRow.style.marginBottom = "8px";
          fieldRow.style.gap = "12px";

          const label = document.createElement("label");
          label.textContent = field;
          label.style.width = "120px";
          label.style.marginBottom = "0";

          const select = document.createElement("select");
          select.dataset.field = field;
          select.className = "field-mapping-select";

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
          fieldRow.appendChild(select);
          list.appendChild(fieldRow);
        });
      },
    );
  }

  async loadDictionaries(languageDictionaries: Record<string, string>) {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ action: "get-dictionaries" }, (response) => {
        const list = document.getElementById("dictionary-list");
        if (list && response.dictionaries) {
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
            langRow.className = "language-row";
            langRow.style.marginBottom = "10px";
            langRow.style.display = "flex";
            langRow.style.alignItems = "center";
            langRow.style.gap = "10px";

            const label = document.createElement("label");
            label.textContent = lang.name;
            label.style.width = "100px";

            const select = document.createElement("select");
            select.className = "dictionary-select";
            select.dataset.lang = lang.code;

            // Add "None" option
            const noneOption = document.createElement("option");
            noneOption.value = "";
            noneOption.textContent = "(None)";
            select.appendChild(noneOption);

            // Populate available dictionaries
            response.dictionaries.forEach((dict: { id: string; name: string }) => {
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
            langRow.appendChild(select);
            list.appendChild(langRow);
          });
        }
        resolve();
      });
    });
  }

  async refreshAnki() {
    this.showStatus("Connecting to Anki...", "info");

    chrome.runtime.sendMessage({ action: "anki-get-decks" }, (deckResponse) => {
      if (deckResponse.error) {
        this.showStatus("Failed to connect to Anki: " + deckResponse.error, "error");
        return;
      }

      const deckSelect = document.getElementById("default-deck") as HTMLSelectElement;
      // Filter duplicate 'Default' entry if it exists in response but was also hardcoded
      // Actually better to just clear it all
      const currentDeck = deckSelect.value;
      deckSelect.innerHTML = "";

      const decks = deckResponse.decks as string[];
      if (decks && decks.length > 0) {
        decks.forEach((deck) => {
          const option = document.createElement("option");
          option.value = deck;
          option.textContent = deck;
          if (deck === currentDeck) option.selected = true;
          deckSelect.appendChild(option);
        });
      } else {
        // Fallback if empty array returned (unlikely)
        const option = document.createElement("option");
        option.value = "Default";
        option.textContent = "Default";
        deckSelect.appendChild(option);
      }

      chrome.runtime.sendMessage({ action: "anki-get-note-types" }, (noteTypeResponse) => {
        if (noteTypeResponse.error) {
          this.showStatus(
            "Connected to Anki but failed to get Note Types: " + noteTypeResponse.error,
            "error",
          );
          return;
        }

        const noteTypeSelect = document.getElementById("default-note-type") as HTMLSelectElement;
        const currentNoteType = noteTypeSelect.value;
        noteTypeSelect.innerHTML = "";

        const noteTypes = noteTypeResponse.noteTypes as string[];
        if (noteTypes && noteTypes.length > 0) {
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

        // If we have a note type from settings, select it, otherwise default to first available
        if (noteTypes.includes(currentNoteType) && currentNoteType !== "Basic") {
          // The currently selected (or saved) note type is valid
        } else if (noteTypes.length > 0) {
          // Select the first one if current is invalid
          noteTypeSelect.value = noteTypes[0];
        }

        this.showStatus("Anki connection successful!", "success");
        // Reload mappings for the potentially updated note type
        this.loadFieldMappings(noteTypeSelect.value);
      });
    });
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
      defaultDeck: (document.getElementById("default-deck") as HTMLSelectElement).value,
      defaultNoteType: (document.getElementById("default-note-type") as HTMLSelectElement).value,
      popupWidth: parseInt((document.getElementById("popup-width") as HTMLInputElement).value, 10),
      popupHeight: parseInt(
        (document.getElementById("popup-height") as HTMLInputElement).value,
        10,
      ),
      theme: (document.getElementById("theme") as HTMLSelectElement).value as any,
      languageDictionaries,
      fieldMappings: {},
    };

    document.querySelectorAll(".field-mapping-select").forEach((el) => {
      const select = el as HTMLSelectElement;
      if (select.value && select.dataset.field) {
        settings.fieldMappings![select.dataset.field] = select.value;
      }
    });

    chrome.runtime.sendMessage(
      { action: "settings-update", data: { partial: settings } },
      (response) => {
        if (response.settings) {
          this.showStatus("Settings saved successfully!", "success");
        } else {
          this.showStatus("Error saving settings.", "error");
        }
      },
    );
  }

  async resetSettings() {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      chrome.runtime.sendMessage({ action: "settings-reset" }, (response) => {
        this.populateForm(response.settings);
        this.loadDictionaries(response.settings.languageDictionaries);
        this.showStatus("Settings reset to defaults.", "success");
      });
    }
  }

  showStatus(message: string, type: "success" | "error" | "info") {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = message;
      status.className = `show ${type}`;
      setTimeout(() => {
        status.className = type;
      }, 3000);
    }
  }
}

new AnkiLexOptions();
