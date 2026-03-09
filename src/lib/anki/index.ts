import * as api from "./api";
import * as note from "./note";
import * as setup from "./setup";

export const anki = {
  ...api,
  ...note,
  ...setup,
};

export * from "./api";
export * from "./client";
export * from "./note";
export * from "./setup";
