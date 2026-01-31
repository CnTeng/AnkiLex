import type { DictionaryResult } from "../models";

/**
 * Shared utility to escape HTML
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generates the HTML for a single Dictionary Result Card
 * Used by both Popup and Content Script (Frame) to ensure identical styling
 */
export function generateResultCardHtml(
  result: DictionaryResult,
  index: number,
  showAddButton: boolean = true,
): string {
  // 1. Header
  let html = `
    <div class="result-header">
      <h2 class="word">${escapeHtml(result.word)}</h2>
      <span class="provider">${escapeHtml(result.provider)}</span>
    </div>
  `;

  // 2. Pronunciations
  const pronunciations = result.pronunciations;

  if (pronunciations.length > 0) {
    html += '<div class="pronunciations">';
    pronunciations.forEach((p) => {
      const type = p.type ? `<span class="pron-type">${escapeHtml(p.type)}</span>` : "";
      const text = p.text ? `<span class="pron-text">${escapeHtml(p.text)}</span>` : "";
      // SVG Icon for audio
      const audio = p.audioUrl
        ? `
        <button class="play-audio" data-url="${escapeHtml(p.audioUrl)}" aria-label="Play audio">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z"/>
            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z"/>
          </svg>
        </button>
      `
        : "";

      if (type || text || audio) {
        html += `
          <div class="pronunciation-item">
            ${type}
            ${text}
            ${audio}
          </div>
        `;
      }
    });
    html += "</div>";
  }

  // 3. Definitions Grid
  if (result.definitions && result.definitions.length > 0) {
    html += '<div class="definitions-grid">';
    result.definitions.forEach((def, defIndex) => {
      html += `<div class="definition-card">`;

      // Flex container for content and button
      html += `<div class="definition-content-wrapper">`;
      html += `<div class="definition-main">`;

      if (def.partOfSpeech) {
        html += `<span class="pos-tag">${escapeHtml(def.partOfSpeech)}</span>`;
      }

      html += `<span class="def-text">${escapeHtml(def.text)}</span>`;

      html += `</div>`; // End definition-main

      // Add to Anki button for this specific definition
      if (showAddButton) {
        html += `
          <button class="add-anki-mini-btn" data-result-index="${index}" data-def-index="${defIndex}" title="Add to Anki">
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
            </svg>
          </button>
        `;
      }

      html += `</div>`; // End definition-content-wrapper

      // Examples inside definition
      if (def.examples && def.examples.length > 0) {
        html += `<div class="examples">`;
        def.examples.forEach((ex) => {
          // Check if ex is string or object (legacy support)
          const text = typeof ex === "string" ? ex : ex.text;
          const translation = typeof ex === "object" && ex.translation ? ex.translation : "";

          html += `<div class="example-item">`;
          html += escapeHtml(text);
          if (translation) {
            html += ` <span style="opacity: 0.7; font-size: 0.9em">${escapeHtml(translation)}</span>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      }

      html += `</div>`; // End definition-card
    });
    html += "</div>"; // End definitions-grid
  }

  return html;
}

/**
 * Attaches event listeners to audio buttons in a container
 */
export function attachAudioListeners(container: HTMLElement) {
  const playButtons = container.querySelectorAll(".play-audio");
  playButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      if (url) {
        const audio = new Audio(url);
        audio.play().catch((err) => console.error("Audio playback failed", err));
      }
    });
  });
}
