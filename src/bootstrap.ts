import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';

// Load private local settings before importing modules that read process.env.
// In hosted environments, environment variables set by the platform take precedence.
if (existsSync('.env')) {
  // This project uses .env as the source of truth for local runs. Clear stale
  // values inherited from an older PowerShell session before loading it.
  for (const name of ['PORT', 'DB_PATH', 'AI_API_KEY', 'AI_API_URL', 'AI_MODEL']) {
    delete process.env[name];
  }
  loadEnvFile('.env');
}

await import('./server.js');
