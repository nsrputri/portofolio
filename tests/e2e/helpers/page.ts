import type { Page } from '@playwright/test';

/**
 * Opens the page the way a visitor with `prefers-reduced-motion: reduce` sees it: every folder open,
 * nothing animating. Content tests use this so they never depend on scroll position or timing.
 */
export async function gotoStatic(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
}

/**
 * Waits until the folders have settled: no open/close animation running and no tab jump in flight.
 * Scroll events only fire on the next frame, so it first lets two frames pass; a scroll made just
 * before this call has then had its chance to start an animation.
 */
export async function idle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-folders-busy'));
}

/** Ids of the open folders, in page order. */
export async function openIds(page: Page): Promise<string[]> {
  return page.locator('.folder[data-open]').evaluateAll((folders) => folders.map((folder) => folder.id));
}

/** True when the page is no wider than the viewport, i.e. there is nothing to scroll sideways. */
export async function noHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}
