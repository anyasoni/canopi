This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
yarn install
```

Then run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment variables

AI-backed deforestation reports use the Anthropic API when a key is present.

1. Copy the example file:

   ```bash
   cp .env.example .env.local
   ```

2. Set `ANTHROPIC_API_KEY` in `.env.local` (see [Anthropic console](https://console.anthropic.com/)).

If the key is missing or empty, `POST /api/report` still works and returns the **rule-based fallback** report. In production (for example on Vercel), configure the same variable in the project’s environment settings instead of committing secrets.

## Tests

Unit tests use [Vitest](https://vitest.dev/). After `yarn install`, run:

```bash
yarn test
```

That starts Vitest in watch mode. For a single run (for example in CI), use:

```bash
yarn test:run
```

Test files live next to the code they cover, named `*.test.ts` (for example under `src/lib/`).
