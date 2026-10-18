import { test, expect } from '@playwright/test';

test.describe('language toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('default is English', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Download CV')).toBeVisible();
    await expect(page.getByText('Unduh CV')).toBeHidden();
    await expect(page).toHaveTitle(/Internet Engineering Portfolio/);
  });

  test('toggle switches to Indonesian without reload', async ({ page }) => {
    const origin = await page.evaluate(() => performance.timeOrigin);
    await page.getByRole('button', { name: 'ID' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByText('Unduh CV')).toBeVisible();
    await expect(page.getByText('Download CV')).toBeHidden();
    await expect(page).toHaveTitle(/Portofolio Teknologi Rekayasa Internet/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Portofolio mahasiswa/);
    await expect(page.getByRole('button', { name: 'ID' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  });

  test('choice persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'ID' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByText('Unduh CV')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ID' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('scroll position kept on toggle', async ({ page }) => {
    await page.evaluate(() => {
      document.body.style.minHeight = '4000px';
    });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.getByRole('button', { name: 'ID' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    const y = await page.evaluate(() => window.scrollY);
    expect(Math.abs(y - 600)).toBeLessThanOrEqual(2);
  });
});
