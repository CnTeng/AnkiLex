# AnkiLex - Anki Dictionary Helper

A browser extension for looking up words in online dictionaries and adding them to Anki.

## Features

- **Vanilla TypeScript** - No frontend frameworks, just clean TypeScript.
- **Service-Oriented Architecture** - Inspired by Bitwarden's extension.
- **Direct AnkiConnect** - Direct integration with Anki desktop via AnkiConnect.
- **Dictionary Support** - Multiple English-Chinese and English-English dictionaries.

## Supported Dictionaries

- Youdao (有道英汉)
- Cambridge (剑桥英汉双解)
- Collins (柯林斯英汉双解)
- Oxford (牛津英汉双解)

## Getting Started

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run build
   ```

3. Load in Chrome/Firefox:
   - Open extensions management page
   - Enable "Developer mode"
   - Load the `dist` folder after building

### Development

Run the compiler in watch mode:

```bash
npm run dev
```

### Testing

Run the tests using vitest:

```bash
npm test
```

## Architecture

The project follows a clean service-oriented architecture:

- `src/lib/` - Business logic and services (Settings, Anki, Dictionary).
- `src/app/background/` - Extension service worker.
- `src/app/popup/` - Popup UI logic.
- `src/app/content/` - Content scripts and popup frame.

## License

MIT
