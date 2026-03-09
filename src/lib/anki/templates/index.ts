import bundle from "iife:anki-card";
import backHbs from "./back.hbs?raw";
import css from "./card.css?inline";
import frontHbs from "./front.hbs?raw";

export const front = frontHbs.replace("{{! FRONT_SCRIPT }}", bundle);
export const back = backHbs.replace("{{! BACK_SCRIPT }}", bundle);
export { css };
