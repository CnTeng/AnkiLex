/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "iife:*" {
  const content: string;
  export default content;
}

declare module "*.hbs?raw" {
  const content: string;
  export default content;
}

declare module "*.scss?inline" {
  const content: string;
  export default content;
}

declare module "*.css?inline" {
  const content: string;
  export default content;
}
