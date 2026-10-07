// Configurazione test: i moduli "astro:env" vengono sostituiti da uno stub che legge process.env.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

// variabili locali (chiavi Supabase locali) per i test
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  resolve: { alias: { 'astro:env/server': fileURLToPath(new URL('./tests/stubs/astro-env.ts', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 60_000, hookTimeout: 120_000, fileParallelism: false, sequence: { concurrent: false } },
});
