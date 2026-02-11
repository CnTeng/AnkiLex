/**
 * Set button to loading state
 */
export function setButtonLoading(btn: HTMLButtonElement) {
  // Save original content if not already saved
  if (!btn.dataset.originalContent) {
    btn.dataset.originalContent = btn.innerHTML;
  }
  btn.disabled = true;

  // Clear content and add state icon
  btn.innerHTML = "";
  const icon = document.createElement("span");
  icon.className = "icon icon-state";
  btn.appendChild(icon);

  btn.classList.add("spinning");
}

/**
 * Set button to success state
 */
export function setButtonSuccess(btn: HTMLButtonElement) {
  btn.classList.remove("spinning");
  btn.classList.add("success");

  // Update state icon
  btn.innerHTML = "";
  const icon = document.createElement("span");
  icon.className = "icon icon-state";
  btn.appendChild(icon);

  setTimeout(() => {
    resetButton(btn);
  }, 2000);
}

/**
 * Set button to error state
 */
export function setButtonError(btn: HTMLButtonElement, errorMsg?: string) {
  btn.classList.remove("spinning");
  btn.classList.add("error");

  // Update state icon
  btn.innerHTML = "";
  const icon = document.createElement("span");
  icon.className = "icon icon-state";
  btn.appendChild(icon);

  if (errorMsg) btn.title = errorMsg;

  setTimeout(() => {
    resetButton(btn);
  }, 3000);
}

/**
 * Reset button to original state
 */
export function resetButton(btn: HTMLButtonElement) {
  // Restore original content or default to plus icon
  const original = btn.dataset.originalContent;
  if (original) {
    btn.innerHTML = original;
  } else {
    // If no original content saved, assume it was a plus icon button
    btn.innerHTML = "";
    const icon = document.createElement("span");
    icon.className = "icon plus";
    btn.appendChild(icon);
  }

  btn.disabled = false;
  btn.classList.remove("success", "error", "spinning");
  btn.title = "";
}
