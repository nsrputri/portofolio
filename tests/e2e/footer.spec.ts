import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { gotoStatic, idle, noHorizontalScroll, openIds } from './helpers/page';

const LANGS = ['en', 'id'] as const;
const IDS = ['about', 'study', 'work', 'cert'];

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });

/** How far the bottom of the footer is above the bottom of the document, in px. 0: nothing follows it. */
async function gapBelowFooter(page: Page): Promise<number> {
  return page.locator('footer').evaluate((el) => {
    const bottom = el.getBoundingClientRect().bottom + window.scrollY;
    return document.documentElement.scrollHeight - bottom;
  });
}

test.describe('footer links', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStatic(page);
  });

  test('optional links render only when set', async ({ page }) => {
    // The dummy content has a WhatsApp number but no Instagram account.
    const whatsapp = page.locator('a[href^="https://wa.me/"]');
    await expect(whatsapp).toHaveCount(1);
    await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\d{8,15}$/);
    await expect(page.locator('a[href*="instagram.com"]')).toHaveCount(0);
  });

  test('contact links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(1);
    for (const name of ['LinkedIn', 'GitHub', 'WhatsApp']) {
      const link = footer.getByRole('link', { name, exact: true });
      await expect(link, name).toHaveCount(1);
      await expect(link, name).toHaveAttribute('rel', /noopener/);
      await expect(link, name).toHaveAttribute('target', '_blank');
    }
    await expect(footer.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', /linkedin\.com/);
    await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', /github\.com/);
  });

  test('CV links follow language', async ({ page }) => {
    const link = page.locator('footer .cv-link:visible');
    await expect(link).toHaveAttribute('href', '/cv/cv-en.pdf');
    await expect(link).toHaveAttribute('download', '');
    await expect(link).toHaveText(/Download CV/);

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(link).toHaveAttribute('href', '/cv/cv-id.pdf');
    await expect(link).toHaveText(/Unduh CV/);
  });
});

test.describe('footer content', () => {
  test('shows the big sticker, the address and the thanks in both languages', async ({ page }) => {
    await gotoStatic(page);
    const footer = page.locator('footer');
    await expect(footer.locator('.sticker')).toContainText('NAMA KAMU');
    await expect(footer.locator('.sticker')).toHaveClass(/sticker--lg/);
    await expect(footer).toContainText('namakamu.pages.dev');

    const thanks = footer.locator('[data-l]:visible', { hasText: /Thanks|Terima kasih/ });
    await expect(thanks).toHaveText(/^Thanks for stopping by!/);
    await idButton(page).click();
    await expect(thanks).toHaveText(/^Terima kasih sudah mampir!/);
  });

  for (const lang of LANGS) {
    test(`fits a 360px phone (${lang})`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.addInitScript((value) => localStorage.setItem('lang', value), lang);
      await gotoStatic(page);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      expect(await noHorizontalScroll(page)).toBe(true);
      const box = await page.locator('footer').boundingBox();
      expect(box?.width).toBeLessThanOrEqual(360);
      for (const link of await page.locator('footer a:visible').all()) {
        const rect = await link.boundingBox();
        if (!rect) throw new Error('footer link has no box');
        expect(rect.x, 'link left').toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width, 'link right').toBeLessThanOrEqual(360);
        expect(rect.height, 'link is a comfortable tap target').toBeGreaterThanOrEqual(40);
      }
    });
  }

  test('passes axe', async ({ page }) => {
    await gotoStatic(page);
    const { violations } = await new AxeBuilder({ page }).include('footer').analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});

test.describe('open graph image', () => {
  test('og image exists', async ({ page }) => {
    const response = await page.request.get('/og.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    // A PNG's size is stored right after its signature: width, then height, both big-endian.
    const png = await response.body();
    expect(png.readUInt32BE(16), 'width').toBe(1200);
    expect(png.readUInt32BE(20), 'height').toBe(630);
  });
});

// The room that lets the last folder scroll past the open line must sit above the footer, not under it.
for (const viewport of [
  { width: 1280, height: 800 },
  // Tall enough that the footer alone cannot give the last folder room to open.
  { width: 1280, height: 1400 },
]) {
  test.describe(`end of page at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('footer ends the page when every folder is open', async ({ page }) => {
      await gotoStatic(page);
      expect(await gapBelowFooter(page)).toBeLessThanOrEqual(1);
    });

    test('the last folder opens by scrolling and the footer still ends the page', async ({ page }) => {
      await page.goto('/');
      await idle(page);
      expect(await openIds(page)).toEqual([]);
      // Folders open one at a time, and each one that opens makes the page longer, so keep going down.
      for (let pass = 0; pass < 12 && (await openIds(page)).length < IDS.length; pass++) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await idle(page);
      }
      expect(await openIds(page)).toEqual(IDS);

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await idle(page);
      expect(await openIds(page)).toEqual(IDS);
      expect(await gapBelowFooter(page)).toBeLessThanOrEqual(1);
      await expect(page.locator('footer')).toBeInViewport();
    });
  });
}
