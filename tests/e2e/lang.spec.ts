import { test, expect } from '@playwright/test';
import { siteContent } from './helpers/content';

test.describe('language toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('default is English', async ({ page }) => {
    const { site } = siteContent();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.cover .status [data-l="en"]')).toBeVisible();
    await expect(page.locator('.cover .status [data-l="en"]')).toHaveText(site.status.en);
    await expect(page.locator('.cover .status [data-l="id"]')).toBeHidden();
    await expect(page).toHaveTitle(site.title.en);
  });

  test('toggle switches to Indonesian without reload', async ({ page }) => {
    const { site } = siteContent();
    const origin = await page.evaluate(() => performance.timeOrigin);
    await page.getByRole('button', { name: 'ID', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.locator('.cover .status [data-l="id"]')).toBeVisible();
    await expect(page.locator('.cover .status [data-l="id"]')).toHaveText(site.status.id);
    await expect(page.locator('.cover .status [data-l="en"]')).toBeHidden();
    await expect(page).toHaveTitle(site.title.id);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.description.id);
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  });

  test('choice persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'ID', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.locator('.cover .status [data-l="id"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('scroll position kept on toggle', async ({ page }) => {
    await page.evaluate(() => {
      document.body.style.minHeight = '4000px';
    });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.getByRole('button', { name: 'ID', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    const y = await page.evaluate(() => window.scrollY);
    expect(Math.abs(y - 600)).toBeLessThanOrEqual(2);
  });
});
