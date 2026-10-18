import { test, expect } from '@playwright/test';

test('home page loads with English default and self-hosted fonts', async ({ page }) => {
  const fontHosts: string[] = [];
  page.on('request', (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url()); });
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('DM Sans');
  expect(fontHosts).toEqual([]);
});
