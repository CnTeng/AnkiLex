import bundle from "iife:anki-card";
import { ANKI_DEFAULT_MODEL_FIELDS, ANKI_DEFAULT_MODEL_NAME, type AnkiModel } from "@common/model";
import backHbs from "./back.hbs?raw";
import css from "./card.css?inline";
import frontHbs from "./front.hbs?raw";

export const ANKI_TEMPLATE_VERSION = 1;
export const ANKI_TEMPLATE_MARKER = `ankilex-template:${ANKI_TEMPLATE_VERSION}`;

const front = frontHbs.replace("{{! FRONT_SCRIPT }}", bundle);
const back = backHbs.replace("{{! BACK_SCRIPT }}", bundle);

export const ANKI_DEFAULT_MODEL_TEMPLATE = {
  Name: "Card 1",
  Front: front,
  Back: back,
};

export const ANKI_DEFAULT_STYLE = `/* ${ANKI_TEMPLATE_MARKER} */\n${css}`;

export const ANKI_DEFAULT_MODEL: AnkiModel = {
  modelName: ANKI_DEFAULT_MODEL_NAME,
  inOrderFields: [...ANKI_DEFAULT_MODEL_FIELDS],
  css: ANKI_DEFAULT_STYLE,
  cardTemplates: [ANKI_DEFAULT_MODEL_TEMPLATE],
};
