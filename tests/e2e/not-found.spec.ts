import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

// Without a top-level 404.html, Cloudflare Pages answers an unknown address with the home page and a
// 200, so a mistyped CV link would download the page's HTML under a .pdf name.
test.describe('unknown addresses', () => {
  test('a missing file answers 404 with the not-found page, not the home page', async ({ page }) => {
    const response = await page.request.get('/cv/does-not-exist.pdf');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toMatch(/^text\/html/);
    const html = await response.text();
    expect(html).toContain('This page does not exist.');
    expect(html).not.toContain('class="cover');
  });

  test('the not-found page leads back home in both languages and passes axe', async ({ page }) => {
    const response = await page.goto('/no/such/page');
    expect(response?.status()).toBe(404);
    const home = page.getByRole('link', { name: /Back to the portfolio/ });
    await expect(home).toHaveAttribute('href', '/');
    await expect(home.locator('[lang="id"]')).toHaveText('Kembali ke portofolio');
    await expect(page.locator('p [lang="id"]')).toHaveText('Halaman ini tidak ada.');
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

    await home.click();
    await expect(page.locator('header.cover')).toBeVisible();
  });
});
