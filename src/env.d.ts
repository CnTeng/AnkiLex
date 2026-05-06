/// <reference types="vite/client" />

declare module "iife:*" {
  const content: string;
  export default content;
}

declare module "*.hbs?raw" {
  const content: string;
  export default content;
}

declare module "*.css?inline" {
  const content: string;
  export default content;
}
