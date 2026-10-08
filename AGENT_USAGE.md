# Agent usage and verification

## Tools and prompts

The implementation was produced in Codex with the user's pasted product/build prompt as the requirements source. Tools used: Codex shell commands for dependency installation, source edits, builds, and tests; the browser was used to attempt local UI access; Render's published docs were checked for disk persistence and build/start configuration. Representative prompt: “Build Release Brief Assistant with a simple TypeScript full-stack stack, deterministic release checks, versioned statements, human review, staleness, final brief, offline tests, and Render configuration.”

## Delegation and suggestions

No delegated agents were used. The implementation chose TypeScript, React, Express, and SQLite to keep frontend/backend in one language and support one-service deployment. No unrequested integrations or deployment action were added.

## Verification

Verified locally: `npm test` passes (9 tests); `npm run build` succeeds; the production server started with `npm start`; the home page returned HTTP 200 and `/api/health` returned `{"ok":true}`. `npm audit --omit=dev` reported no production dependency vulnerabilities. Render deployment was not attempted.

## Important limitations

Provider calls require an OpenAI-compatible endpoint and key. Mock generation is deterministic and heuristic. The UI does not provide authentication; a real deployment with sensitive release data needs access control. Render SQLite storage is configured for a single instance.

## Rejected implementation approach

The initial SQLite package choice (`better-sqlite3`) required a local native C++ toolchain that was unavailable in this environment. That install attempt failed, so the native dependency was removed and replaced with Node's built-in `node:sqlite`; the project now requires Node 22.13 or newer. This avoids a native addon, though Node currently emits an experimental API warning for `node:sqlite`.
