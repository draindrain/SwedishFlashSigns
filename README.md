# Swedish Traffic Signs Flashcards

A flashcard app for studying Swedish traffic signs (*vägmärken*), built with React and Vite.

**[Open the app](https://draindrain.github.io/SwedishFlashSigns/)**

## Features

- Browse all 344 official Swedish traffic signs across 19 categories (A–Y)
- Flashcard mode: view the sign image and recall its name
- Quiz mode: multiple-choice questions on sign names or images
- Filter by category to focus on specific sign types
- Sign images and data sourced directly from [Transportstyrelsen](https://www.transportstyrelsen.se/sv/vagtrafik/trafikregler-och-vagmarken/vagmarken/)

## Development

```bash
npm install
npm run dev
```

### Updating sign data

To re-scrape sign images and data from Transportstyrelsen:

```bash
npm run scrape
```

This requires Playwright's Chromium browser. Install it once with:

```bash
npx playwright install chromium
```

The scraper downloads all sign images to `public/data/images/` and regenerates `src/data/signs.ts`.
