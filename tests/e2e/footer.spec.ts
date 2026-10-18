import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { siteContent } from './helpers/content';
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

  // components.test.ts renders both cases from fixtures; this checks the ones the content uses.
  test('optional links render only when set', async ({ page }) => {
    const { links } = siteContent().site;
    const whatsapp = page.locator('footer a[href^="https://wa.me/"]');
    await expect(whatsapp).toHaveCount(links.whatsapp ? 1 : 0);
    if (links.whatsapp) await expect(whatsapp).toHaveAttribute('href', `https://wa.me/${links.whatsapp}`);
    const instagram = page.locator('footer').getByRole('link', { name: 'Instagram', exact: true });
    await expect(instagram).toHaveCount(links.instagram ? 1 : 0);
    if (links.instagram) await expect(instagram).toHaveAttribute('href', links.instagram);
  });

  test('contact links', async ({ page }) => {
    const { links } = siteContent().site;
    const footer = page.locator('footer');
    await expect(footer.locator('a[href^="mailto:"]')).toHaveAttribute('href', `mailto:${links.email}`);
    const external = [
      { name: 'LinkedIn', href: links.linkedin },
      { name: 'GitHub', href: links.github },
      ...(links.whatsapp ? [{ name: 'WhatsApp', href: `https://wa.me/${links.whatsapp}` }] : []),
      ...(links.instagram ? [{ name: 'Instagram', href: links.instagram }] : []),
    ];
    for (const { name, href } of external) {
      const link = footer.getByRole('link', { name, exact: true });
      await expect(link, name).toHaveCount(1);
      await expect(link, name).toHaveAttribute('href', href);
      await expect(link, name).toHaveAttribute('rel', /noopener/);
      await expect(link, name).toHaveAttribute('target', '_blank');
    }
  });

  test('CV links follow language', async ({ page }) => {
    const { site, ui } = siteContent();
    const link = page.locator('footer .cv-link:visible');
    await expect(link).toHaveAttribute('href', site.cv.en);
    await expect(link).toHaveAttribute('download', '');
    await expect(link).toContainText(ui.downloadCv.en);

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(link).toHaveAttribute('href', site.cv.id);
    await expect(link).toContainText(ui.downloadCv.id);
  });
});

test.describe('footer content', () => {
  test('shows the big sticker, the address and the thanks in both languages', async ({ page }) => {
    const { site } = siteContent();
    await gotoStatic(page);
    const footer = page.locator('footer');
    await expect(footer.locator('.sticker')).toContainText(site.name);
    await expect(footer.locator('.sticker')).toHaveClass(/sticker--lg/);
    // The address is the `site` setting in astro.config.mjs, the same one the canonical link uses.
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    await expect(footer.locator('.foot-url')).toHaveText(new URL(canonical!).host);

    const thanks = footer.locator('.foot-thanks [data-l]:visible');
    await expect(thanks).toHaveText(site.thanks.en);
    await idButton(page).click();
    await expect(thanks).toHaveText(site.thanks.id);
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

  test('og image is small enough for WhatsApp', async ({ page }) => {
    // WhatsApp drops a link preview image of about 300 KB or more.
    const response = await page.request.get('/og.png');
    expect((await response.body()).length).toBeLessThan(300_000);
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
