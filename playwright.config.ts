import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4321';

export default defineConfig({
  testDir: 'tests/e2e',
  // Saves src/data/content.ts as JSON, so the tests can check the page against the real content.
  globalSetup: './tests/e2e/global-setup.ts',
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
    url: baseURL,
    timeout: 180_000,
  },
  use: { baseURL },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
});
