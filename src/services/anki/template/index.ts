import bundle from "iife:anki-card";
import backHbs from "./back.hbs?raw";
import css from "./card.css?inline";
import frontHbs from "./front.hbs?raw";

const front = frontHbs.replace("{{! FRONT_SCRIPT }}", bundle);
const back = backHbs.replace("{{! BACK_SCRIPT }}", bundle);

export const ANKI_MODEL_TEMPLATE = {
  Name: "OneDict",
  Front: front,
  Back: back,
};

export const ANKI_MODEL_CSS = css;
