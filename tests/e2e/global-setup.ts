import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { getViteConfig } from 'astro/config';
import { createServer } from 'vite';
import { CONTENT_SNAPSHOT } from './helpers/content';

/**
 * Loads src/data/content.ts the way the build does (through Vite with Astro's plugins, so its image
 * imports work and the schema runs) and saves it as JSON for helpers/content.ts. Invalid content
 * fails here with the same "Invalid content:" message as the build.
 */
export default async function globalSetup(): Promise<void> {
  const config = await getViteConfig(
    {
      appType: 'custom',
      logLevel: 'silent',
      // Its own cache, so this run does not invalidate the one `npm run dev` keeps.
      cacheDir: 'node_modules/.cache/e2e/vite',
      server: { middlewareMode: true, hmr: false, ws: false },
    },
    { logLevel: 'silent' },
  )({ command: 'serve', mode: 'test' });
  const server = await createServer({ ...config, configFile: false });
  try {
    const { content } = await server.ssrLoadModule('/src/data/content.ts');
    mkdirSync(dirname(CONTENT_SNAPSHOT), { recursive: true });
    writeFileSync(CONTENT_SNAPSHOT, JSON.stringify(content));
  } finally {
    await server.close();
  }
}
