import { initChromeServices } from "@services";
import { ANKI_DEFAULT_MODEL } from "@ui/dictionary/templates";

initChromeServices({
  getDefaultModel: () => ANKI_DEFAULT_MODEL,
});
