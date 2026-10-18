import type { Page } from '@playwright/test';

/**
 * Opens the page the way a visitor with `prefers-reduced-motion: reduce` sees it: every folder open,
 * nothing animating. Content tests use this so they never depend on scroll position or timing.
 */
export async function gotoStatic(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
}

/** True when the page is no wider than the viewport, i.e. there is nothing to scroll sideways. */
export async function noHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}
