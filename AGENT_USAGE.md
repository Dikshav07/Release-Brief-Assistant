# Agent usage and verification

This file explains how AI assistance was used to build the project, what was checked, and what still needs attention.

## Tools and prompts

Codex was used to read and edit the project, run commands, and work through setup and provider errors. The browser was used to check local access. Render documentation was consulted for deployment and storage configuration.

The main request was to build a release-brief app with version history, release checks, AI draft statements, human review, stale-statement handling, a final brief, tests, and Render configuration.

## Delegated work and design choices

No work was delegated to other agents. The app uses TypeScript, React, Express, and SQLite so the frontend and backend can be maintained in one project and deployed as one web service.

An attempt to use `better-sqlite3` was rejected because it needed a native C++ build toolchain that was unavailable in the environment. The app uses Node's built-in `node:sqlite` instead, so it requires Node.js 22.13 or newer. Node may print an experimental API warning when SQLite starts.

## How the app was checked

- The development server was run locally and reported that it was listening on port 3000.
- A local Gemini request succeeded with `gemini-3.5-flash-lite`. The app logged provider mode, kept five statements, and dropped one statement during validation.
- The focused core and AI tests passed: 10 tests passed across `src/ai.test.ts` and `src/core.test.ts`.
- The full test run could not complete in the restricted environment: its API integration test could not open a local network connection (`EACCES`). This does not confirm whether that test passes on a normal developer machine.
- Render deployment and hosted behavior were not independently verified as part of this work.

Run the test suite with:

```sh
npm test
```

## Gemini setup and troubleshooting

Provider drafting uses Google's Gemini API through its OpenAI-compatible chat completions endpoint. Configure these values in `.env` for local development or in the hosting provider's secret settings:

```env
AI_API_KEY=your-gemini-api-key
AI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
AI_MODEL=gemini-3.5-flash-lite
```

Never put a real key in `.env.example` or commit it to source control. Without `AI_API_KEY`, the app uses simple mock/template drafts instead of calling Gemini.

Provider failures are logged as `ai_call_failed` with the status and a shortened response body. The key is redacted from that log. A `400` response may indicate a key or request problem; a `404` response may indicate that the selected model is unavailable to that key. Check the logged response, confirm the configured model is available, and restart the local server after changing `.env`. On Render, update the Environment settings and redeploy.

## Important limitations

- AI statements and impact labels are drafts and need human review.
- The app has no user accounts or access controls. Add access protection before using it with confidential release information.
- The SQLite configuration is intended for one running app instance. Use a hosted database before scaling to multiple instances.
- Without a Gemini key, generated content comes from simple deterministic mock rules.
