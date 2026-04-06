# Plain Language Translator

Turn complex writing into plain language.

This app uses a translation-style interface to rewrite dense text into a clearer, more usable version while preserving meaning, obligations, dates, names, and practical effect. It uses OpenRouter when configured and falls back to a deterministic mock rewrite engine when no API key is available.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- API route for rewriting
- Vitest + Testing Library

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Add your OpenRouter settings if you want live AI output:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-5.2
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Plain Language Translator
```

If `OPENROUTER_API_KEY` or `OPENROUTER_MODEL` is missing, the app stays fully usable in mock mode.

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run lint` runs ESLint
- `npm run test` runs the test suite once
- `npm run test:watch` runs tests in watch mode
- `npm run typecheck` runs TypeScript without emitting files

## File Structure

```text
.
├── src
│   ├── app
│   │   ├── api/rewrite/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/translator
│   │   ├── compare-view.tsx
│   │   ├── detail-tabs.tsx
│   │   ├── theme-toggle.tsx
│   │   └── translator-app.tsx
│   ├── hooks/use-local-draft.ts
│   ├── lib
│   │   ├── mock-rewrite.ts
│   │   ├── openrouter.ts
│   │   ├── prompt.ts
│   │   ├── rewrite-schema.ts
│   │   ├── storage.ts
│   │   └── types.ts
│   └── tests
│       ├── mock-rewrite.test.ts
│       ├── storage.test.ts
│       ├── translator-app.test.tsx
│       └── setup/vitest.setup.ts
├── .env.example
├── package.json
└── vitest.config.ts
```

## Notes

- The main UI intentionally stays simple: original text, plain-language result, convert, clear, copy, and compare.
- The result view includes compact tabs for the quality checklist, change notes, and unclear source sections.
- Draft text autosaves in local storage so refreshes do not wipe the current work.
- The footer disclaimer is built into the app: the tool improves clarity, but it does not verify legal, medical, or factual accuracy.
