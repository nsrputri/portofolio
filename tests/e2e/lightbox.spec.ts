import { test, expect, type Page } from '@playwright/test';
import { gotoStatic, noHorizontalScroll } from './helpers/page';

const LANGS = ['en', 'id'] as const;

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });
const dialog = (page: Page) => page.locator('#lightbox');
const body = (page: Page) => page.locator('#lightbox .lightbox-body');
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

async function expectOpen(page: Page) {
  await expect(dialog(page)).toHaveJSProperty('open', true);
}

async function expectClosed(page: Page) {
  await expect(dialog(page)).toHaveJSProperty('open', false);
}

test.describe('certificate details', () => {
  test('certificate opens full scan', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    const scan = page.locator('.lightbox-body img').first();
    await expect.poll(() => scan.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    // Title, issuer and year come with the scan, and the dialog is named by the title.
    await expect(page.getByRole('dialog', { name: 'MTCNA' })).toBeVisible();
    await expect(body(page)).toContainText('MikroTik · 2024');
  });

  test('scan alt text follows the language', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expect(page.locator('.lightbox-body img').first()).toHaveAttribute('alt', 'Placeholder scan of the MTCNA certificate');
    await page.keyboard.press('Escape');
    await expectClosed(page);

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    // The details are cloned from a template at open time, so their alt has to match the current language.
    await expect(page.locator('.lightbox-body img').first()).toHaveAttribute('alt', 'Pindaian sertifikat MTCNA (contoh)');
  });

  test('credential link opens in a new tab only where the certificate has one', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    const link = page.locator('.lightbox-body a[target="_blank"][rel="noopener"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://example.com/credentials/mtcna');
    await expect(link).toContainText('View credential');
    await page.keyboard.press('Escape');
    await expectClosed(page);

    // The third certificate has no credential URL and no PDF.
    await page.locator('.c-card').nth(2).click();
    await expect(page.getByRole('dialog', { name: 'Fiber Optic Fundamentals' })).toBeVisible();
    await expect(page.locator('.lightbox-body a')).toHaveCount(0);
  });

  test('credential link is localized', async ({ page }) => {
    await gotoStatic(page);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('.c-card').first().click();
    await expect(page.locator('.lightbox-body a[target="_blank"]')).toContainText('Lihat kredensial');
  });

  test('opening another card replaces the content instead of adding to it', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expect(page.getByRole('dialog', { name: 'MTCNA' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expectClosed(page);
    await page.locator('.c-card').nth(1).click();
    await expect(page.getByRole('dialog', { name: 'CCNA: Introduction to Networks' })).toBeVisible();
    await expect(page.locator('.lightbox-body img')).toHaveCount(1);
    await expect(body(page)).not.toContainText('MTCNA');
  });
});

test.describe('work details', () => {
  test('keyboard opens a card', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.w-card').first().focus();
    await page.keyboard.press('Enter');
    await expectOpen(page);
    // innerText skips the hidden Indonesian copy that sits next to the English one.
    await expect(body(page)).toContainText('Dummy text. Describe the practicum', { useInnerText: true });
    await expect(body(page)).not.toContainText('Teks dummy', { useInnerText: true });
  });

  test('details follow the language', async ({ page }) => {
    await gotoStatic(page);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('.w-card').first().click();
    await expectOpen(page);
    await expect(body(page)).toContainText('Teks dummy. Jelaskan praktikumnya', { useInnerText: true });
    await expect(body(page)).not.toContainText('Dummy text', { useInnerText: true });
    await expect(page.getByRole('dialog', { name: 'Konfigurasi jaringan kantor kecil dengan Mikrotik' })).toBeVisible();
    await expect(page.locator('.lightbox-body .tag')).toContainText(/praktikum/i, { useInnerText: true });
    await expect(page.locator('.lightbox-body img').first()).toHaveAttribute('alt', 'Foto praktikum Mikrotik (contoh)');
  });

  test('shows title, category, meta, details, the photo and the gallery', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.w-card').first().click();
    await expectOpen(page);
    await expect(page.getByRole('dialog', { name: 'Configuring a small office network with Mikrotik' })).toBeVisible();
    // The tag is upper-cased by CSS and innerText follows it.
    await expect(body(page)).toContainText(/practicum/i, { useInnerText: true });
    await expect(body(page)).toContainText('Networking Lab · 2024', { useInnerText: true });
    // The main photo plus the two gallery images of the first item.
    const images = page.locator('.lightbox-body img');
    await expect(images).toHaveCount(3);
    await expect(images.nth(1)).toHaveAttribute('alt', 'Placeholder photo 2 of the practicum');
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('loading', 'lazy');
    }
    await expect(images.first()).toHaveAttribute('alt', 'Placeholder photo of the Mikrotik practicum');
    await expect.poll(() => images.first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expectClosed(page);
    // An item without a gallery has just its photo.
    await page.locator('.w-card').nth(1).click();
    await expectOpen(page);
    await expect(page.locator('.lightbox-body img')).toHaveCount(1);
  });
});

test.describe('placement', () => {
  test('the dialog is centred in the window', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    const box = await dialog(page).boundingBox();
    if (!box) throw new Error('expected the dialog to have a box');
    // Centred in the area a fixed element can use. A scrollbar's width stays reserved while the page is
    // locked (so the page behind does not shift sideways), which makes that area a little narrower than
    // the window; a probe with `inset: 0` measures it.
    const area = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none';
      document.body.append(probe);
      const rect = probe.getBoundingClientRect();
      probe.remove();
      return { width: rect.width, height: rect.height };
    });
    expect(area.width, 'the probe covers the window').toBeGreaterThan(1200);
    expect(box.x + box.width / 2, 'horizontal centre').toBeCloseTo(area.width / 2, 0);
    expect(box.y + box.height / 2, 'vertical centre').toBeCloseTo(area.height / 2, 0);
    // The corner of the window is the backdrop, not the dialog.
    expect(await page.evaluate(() => document.elementFromPoint(5, 5) === document.getElementById('lightbox'))).toBe(true);
  });
});

test.describe('closing', () => {
  test('Esc closes and returns focus', async ({ page }) => {
    await gotoStatic(page);
    const card = page.locator('.c-card').first();
    await card.click();
    await expectOpen(page);
    await page.keyboard.press('Escape');
    await expectClosed(page);
    expect(await page.evaluate(() => document.activeElement === document.querySelector('.c-card'))).toBe(true);
    await expect(card).toBeFocused();
  });

  test('backdrop click closes', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    await page.mouse.click(5, 5);
    await expectClosed(page);
  });

  test('a click inside the dialog does not close it', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.w-card').first().click();
    await expectOpen(page);
    await page.locator('.lightbox-body .lb-title').click();
    await expectOpen(page);
  });

  test('a drag that starts inside and ends on the backdrop does not close it', async ({ page }) => {
    await gotoStatic(page);
    await page.locator('.w-card').first().click();
    await expectOpen(page);
    const title = await page.locator('.lightbox-body .lb-title').boundingBox();
    if (!title) throw new Error('expected the title to have a box');
    await page.mouse.move(title.x + 5, title.y + title.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5, { steps: 4 });
    await page.mouse.up();
    await expectOpen(page);
  });

  for (const lang of LANGS) {
    test(`close button closes, empties the body and returns focus (${lang})`, async ({ page }) => {
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      const card = page.locator('.w-card').first();
      await card.click();
      await expectOpen(page);
      const close = page.locator('#lightbox button.lightbox-close');
      await expect(close.locator('[data-l]:visible')).toHaveText(lang === 'en' ? 'Close' : 'Tutup');
      // The close button is where focus lands, so a keyboard user can leave straight away.
      await expect(close).toBeFocused();
      await close.click();
      await expectClosed(page);
      await expect(body(page)).toBeEmpty();
      await expect(card).toBeFocused();
    });
  }
});

test.describe('scroll lock', () => {
  test('page does not scroll while open', async ({ page }) => {
    await gotoStatic(page);
    await page.mouse.move(640, 400);
    // Control: with nothing open the wheel does scroll the page, so the checks below are not vacuous.
    await page.mouse.wheel(0, 400);
    await expect.poll(() => scrollY(page)).toBeGreaterThan(0);

    // Opening the last folder's card scrolls the page to the bottom, so the test wheels upwards:
    // that is the direction with room to move.
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    const before = await scrollY(page);
    expect(before, 'room to scroll up').toBeGreaterThan(800);

    for (const [x, y] of [
      [5, 5], // on the backdrop
      [640, 400], // on the dialog
    ]) {
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -800);
      await page.waitForTimeout(400);
      expect(await scrollY(page), `wheel at ${x},${y}`).toBe(before);
    }

    // Closing hands scrolling back.
    await page.keyboard.press('Escape');
    await expectClosed(page);
    await page.mouse.wheel(0, -400);
    await expect.poll(() => scrollY(page)).toBeLessThan(before);
  });
});

test.describe('on a phone (360px)', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  for (const lang of LANGS) {
    test(`the dialog fits the screen and long details scroll inside it (${lang})`, async ({ page }) => {
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      // The first practicum has the most content: a title, details, a photo and two more images.
      await page.locator('.w-card').first().click();
      await expectOpen(page);
      await expect.poll(() => page.locator('.lightbox-body img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

      const box = await dialog(page).boundingBox();
      if (!box) throw new Error('expected the dialog to have a box');
      expect(box.x, 'left edge').toBeGreaterThanOrEqual(0);
      expect(box.y, 'top edge').toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, 'right edge').toBeLessThanOrEqual(360);
      expect(box.y + box.height, 'bottom edge').toBeLessThanOrEqual(640);

      const close = await page.locator('#lightbox .lightbox-close').boundingBox();
      if (!close) throw new Error('expected the close button to have a box');
      expect(close.x + close.width).toBeLessThanOrEqual(360);
      expect(close.y).toBeGreaterThanOrEqual(0);
      expect(close.height, 'tap target').toBeGreaterThanOrEqual(44);

      const metrics = await body(page).evaluate((el) => ({
        scrolls: el.scrollHeight > el.clientHeight,
        sideways: el.scrollWidth > el.clientWidth,
      }));
      expect(metrics.scrolls, 'the details scroll inside the dialog').toBe(true);
      expect(metrics.sideways, 'nothing overflows sideways').toBe(false);
      expect(await noHorizontalScroll(page)).toBe(true);
    });
  }
});
