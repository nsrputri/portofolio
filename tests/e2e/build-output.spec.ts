import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { test, expect } from '@playwright/test';

// Checks the files of the build the test server is running (playwright.config.ts builds it first).
const ROOT = process.cwd();
const IMAGE = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

const sha = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');

test.describe('build output', () => {
  // Astro copies an image unchanged when code reads its `src`. A phone photo is several MB and its
  // EXIF data can hold where it was taken, so only the resized, re-encoded copies may be published.
  test('no original photo from src/assets is published, only optimised copies', () => {
    const originals = new Map(
      filesUnder(join(ROOT, 'src', 'assets'))
        .filter((file) => IMAGE.test(file))
        .map((file) => [sha(file), relative(ROOT, file)]),
    );
    expect(originals.size, 'src/assets has images to check').toBeGreaterThan(0);

    const published = filesUnder(join(ROOT, 'dist', '_astro')).filter((file) => IMAGE.test(file));
    const shipped = published
      .filter((file) => originals.has(sha(file)))
      .map((file) => `${relative(ROOT, file)} (copy of ${originals.get(sha(file))})`);
    expect(shipped, 'original images in dist/_astro').toEqual([]);
    // The images are still there, as optimised WebP: the check above is not passing on an empty folder.
    expect(published.filter((file) => extname(file) === '.webp').length).toBeGreaterThan(0);
  });
});
