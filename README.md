# Release Brief Assistant

A small release communication workspace for recording versioned release packages, checking required information, drafting cited communications, reviewing every statement, comparing versions, and generating a brief from approved, current statements.

## Demo

1. Run the app and enter a release package. Use `None` for intentionally empty sections.
2. Save the first version and inspect deterministic checks.
3. Generate AI drafts. Without a key, the app labels heuristic output as mock/template-generated.
4. Edit, approve, or reject each statement. Save edits to return that statement to pending.
5. Save a changed package as another version, compare versions, and inspect stale citations.
6. Generate the final brief. It contains only approved, non-stale content and clearly states that human review is not release approval.

## Tech stack

TypeScript, React, Vite, Express, Node's built-in SQLite API (`node:sqlite`), Zod validation, and Vitest. The server serves the built frontend and API from one web service.

## Setup and run

Requires Node.js 22.13 or newer (`node:sqlite` is used for persistent SQLite without a native addon).

```sh
npm install
cp .env.example .env
npm run dev
```

Open the port printed by the server (it starts at `http://localhost:3000` and automatically tries the next port up to 10 times if that port is busy). To build and run the production server locally:

```sh
npm run build
npm start
```

## Environment variables

See `.env.example`: `PORT`, `DB_PATH`, `AI_API_KEY`, `AI_MODEL`, and `AI_API_URL`. The optional provider uses an OpenAI-compatible chat completions endpoint. The key is read only in `src/ai.ts`; it is never logged. Without a key, deterministic mock/template drafts are used.

## Architecture

- `src/core.ts`: pure package normalization, IDs and hashes, deterministic checks, version diffs, and staleness.
- `src/ai.ts`: sole provider boundary, mock generator, schema and citation validation, and AI log records.
- `src/db.ts`: SQLite schema and database initialization.
- `src/server.ts`: Express API, input validation, workflow coordination, and structured event logs.
- `src/main.tsx`, `src/style.css`: responsive React UI. React renders release and model text as text nodes; there is no HTML injection rendering.
- `src/*.test.ts`: offline unit tests for core and AI behavior.

## Staleness and version history

Item IDs are retained for exact text matches; remaining changed lines reuse unused IDs in field order, and additional lines get the next number. Hashes are based on trimmed text. A statement goes stale when its cited item changes or disappears in the latest version. Unsupported claims also track QA scope; missing-information statements track the full package scope. Older version statements stay attached to that version and are evaluated against the latest version in the release.

## AI validation and human review

AI results must match a strict Zod shape. Citations must exist in the version; text must be non-empty; ordinary statements must cite at least one item; prohibited release-approval language is dropped. Invalid entries are returned as validation errors and logged. AI writes draft statements and classifications only. Only human actions can edit, approve, reject, or complete review. Completing review is a record of review and never means the release itself is approved. The final brief filters out pending, rejected, and stale statements.

## Testing

```sh
npm test
```

Tests use mock AI and run without credentials or network. `sample_release.json` shows a package intended to exercise the QA evidence, migration, and QA gap checks.

## Deployment

`render.yaml` prepares one Render Node web service. Build command: `npm install && npm run build`; start command: `npm start` (runs `node dist/src/server.js`). Set `DB_PATH=/var/data/releases.sqlite`, attach the declared persistent disk at `/var/data`, and set `AI_API_KEY` only if provider drafts are wanted. `AI_MODEL` is configurable. Render documents that service filesystems are ephemeral by default and that persistent disks retain files under their mount path across deploys/restarts; disks are available on paid web services, are single-instance, and are runtime-only. The database path is placed under the disk mount. See [Render persistent disks](https://render.com/docs/disks), [Render web services](https://render.com/docs/web-services), and [Render deploys](https://render.com/docs/deploys). No deployment was performed. The app is not configured for multi-instance SQLite access.

After deploy, verify: open the page; create a release; save a version; generate drafts; edit and approve statements; save a second version; compare and view stale statements; open the final brief; complete human review after resolving pending/stale items. Confirm data remains after a redeploy.

## Limitations and excluded scope

No Git provider integration, software deployment, rollback, or public changelog publishing. The mock generator is intentionally simple and should be treated as a template. Provider mode expects an OpenAI-compatible chat completions response. There is no authentication or multi-user access control, so deploy only behind suitable access controls for confidential release data. SQLite on a persistent disk supports one service instance; use a hosted database before scaling out. Impact classification is a draft and needs human review.

## AI tool use and verification

AI assistance was used to draft implementation code and test cases from the product requirements. The output was reviewed against the required API, deterministic rules, citation validation, human-only review controls, and staleness behavior. Verification completed locally: `npm test` passes (9 tests), `npm run build` succeeds, `npm start` serves the app, `/` returns HTTP 200, `/api/health` returns `{"ok":true}`, and `npm audit --omit=dev` reports no production dependency vulnerabilities.

