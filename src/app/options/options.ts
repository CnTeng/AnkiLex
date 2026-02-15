/**
 * Options Page Entry Point
 */

import { initSettingsView } from "@lib/view";

async function init(): Promise<void> {
  await initSettingsView();
}

init();
