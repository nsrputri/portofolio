import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SiteContent } from '../../../src/data/schema';
import { type FolderId, visibleFolders } from '../../../src/data/visible-folders';
import { EMPHASIS } from '../../../src/lib/rich';

/** Where global-setup.ts saves the content for the tests (inside node_modules, so never committed). */
export const CONTENT_SNAPSHOT = join(process.cwd(), 'node_modules', '.cache', 'e2e', 'content.json');

let cached: SiteContent | undefined;

/**
 * The site's real content, src/data/content.ts as the build sees it, so the tests check the page
 * against whatever the owner wrote instead of fixed dummy strings. Images come back as plain data.
 * Call it inside a test: the file is written by the global setup, which runs before the tests.
 */
export function siteContent(): SiteContent {
  if (!cached) {
    try {
      cached = JSON.parse(readFileSync(CONTENT_SNAPSHOT, 'utf8')) as SiteContent;
    } catch (error) {
      throw new Error(`No content snapshot at ${CONTENT_SNAPSHOT}. Run the tests with "npx playwright test", whose global setup writes it.`, {
        cause: error,
      });
    }
  }
  return cached;
}

/** The folder ids the page shows, in order (What I Do and Certificates only once they have items). */
export function shownFolders(): FolderId[] {
  return visibleFolders(siteContent());
}

/** A content string as it reads on the page: `*x*` loses its asterisks and a line break reads as a space. */
export function plain(text: string): string {
  return text.replace(EMPHASIS, '$1').replace(/\s*\n\s*/g, ' ');
}

/** The `*x*` parts of a content string, which the page shows in <em>, in order. */
export function emphasised(text: string): string[] {
  return [...text.matchAll(EMPHASIS)].map((match) => match[1]);
}

/** Matches any text that contains `text` as it is (no character in it is special). */
export function containing(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}
