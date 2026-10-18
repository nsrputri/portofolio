/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // No unit tests exist until Task 2; keep `npm test` green meanwhile.
    passWithNoTests: true,
  },
});
