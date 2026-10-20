import { test, expect, type Page } from '@playwright/test';
import { containing, siteContent } from './helpers/content';
import { gotoStatic, noHorizontalScroll } from './helpers/page';

const LANGS = ['en', 'id'] as const;

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });
const dialog = (page: Page) => page.locator('#lightbox');
/** The first card on the page that opens the lightbox, whichever folder it is in. */
const anyCard = (page: Page) => page.locator('[data-lightbox]').first();
const hasWork = () => siteContent().work.items.length > 0;
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
    const [cert] = siteContent().certificates.items;
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    const scan = page.locator('.lightbox-body img').first();
    await expect.poll(() => scan.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

    // Title, issuer and year come with the scan, and the dialog is named by the title.
    await expect(page.getByRole('dialog', { name: cert.title })).toBeVisible();
    await expect(body(page)).toContainText(`${cert.issuer} · ${cert.year}`);
  });

  test('scan alt text follows the language', async ({ page }) => {
    const [cert] = siteContent().certificates.items;
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expect(page.locator('.lightbox-body img').first()).toHaveAttribute('alt', cert.alt.en);
    await page.keyboard.press('Escape');
    await expectClosed(page);

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('.c-card').first().click();
    await expectOpen(page);
    // The details are cloned from a template at open time, so their alt has to match the current language.
    await expect(page.locator('.lightbox-body img').first()).toHaveAttribute('alt', cert.alt.id);
  });

  // components.test.ts covers every combination from fixtures; this checks the certificates the content has.
  test('credential and PDF links open in a new tab only where the certificate has them', async ({ page }) => {
    const { certificates, ui } = siteContent();
    await gotoStatic(page);
    for (const [i, cert] of certificates.items.entries()) {
      await page.locator('.c-card').nth(i).click();
      await expect(page.getByRole('dialog', { name: cert.title })).toBeVisible();
      const links = page.locator('.lightbox-body a');
      const expected = [cert.credentialUrl, cert.pdf].filter((href): href is string => Boolean(href));
      await expect(links, cert.title).toHaveCount(expected.length);
      expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href'))), cert.title).toEqual(expected);
      for (const link of await links.all()) {
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener');
      }
      if (cert.credentialUrl) await expect(links.first()).toContainText(ui.viewCredential.en);
      if (cert.pdf) {
        const response = await page.request.get(cert.pdf);
        expect(response.status(), cert.pdf).toBe(200);
        expect(response.headers()['content-type'], cert.pdf).toBe('application/pdf');
      }
      await page.keyboard.press('Escape');
      await expectClosed(page);
    }
  });

  test('credential link is localized', async ({ page }) => {
    const { certificates, ui } = siteContent();
    const index = certificates.items.findIndex((cert) => cert.credentialUrl);
    test.skip(index < 0, 'no certificate in the content has a credential URL (components.test.ts covers the label)');
    await gotoStatic(page);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('.c-card').nth(index).click();
    await expect(page.locator('.lightbox-body a[target="_blank"]').first()).toContainText(ui.viewCredential.id);
  });

  test('opening another card replaces the content instead of adding to it', async ({ page }) => {
    test.skip(!hasWork(), 'needs a What I Do card to switch to');
    const { certificates, work } = siteContent();
    await gotoStatic(page);
    await page.locator('.c-card').first().click();
    await expect(page.getByRole('dialog', { name: certificates.items[0].title })).toBeVisible();
    await expect(page.locator('.lightbox-body .lb-scan')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expectClosed(page);
    await page.locator('.w-card').first().click();
    await expect(page.getByRole('dialog', { name: work.items[0].title.en })).toBeVisible();
    await expect(page.locator('.lightbox-body .lb-detail')).toHaveCount(1);
    await expect(page.locator('.lightbox-body .lb-scan')).toHaveCount(0);
  });
});

test.describe('work details', () => {
  test.beforeEach(() => {
    test.skip(!hasWork(), 'What I Do is hidden until it has an item');
  });

  test('keyboard opens a card', async ({ page }) => {
    const [item] = siteContent().work.items;
    await gotoStatic(page);
    await page.locator('.w-card').first().focus();
    await page.keyboard.press('Enter');
    await expectOpen(page);
    // innerText skips the hidden Indonesian copy that sits next to the English one.
    await expect(body(page)).toContainText(item.details.en, { useInnerText: true });
    if (item.details.id !== item.details.en) {
      await expect(body(page)).not.toContainText(item.details.id, { useInnerText: true });
    }
  });

  test('details follow the language', async ({ page }) => {
    const { work, ui } = siteContent();
    const [item] = work.items;
    await gotoStatic(page);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('.w-card').first().click();
    await expectOpen(page);
    await expect(body(page)).toContainText(item.details.id, { useInnerText: true });
    if (item.details.id !== item.details.en) {
      await expect(body(page)).not.toContainText(item.details.en, { useInnerText: true });
    }
    await expect(page.getByRole('dialog', { name: item.title.id })).toBeVisible();
    // The tag is upper-cased by CSS and innerText follows it.
    await expect(page.locator('.lightbox-body .tag')).toContainText(new RegExp(containing(ui.categories[item.category].id).source, 'i'), {
      useInnerText: true,
    });
    await expect(page.locator('.lightbox-body img').first()).toHaveAttribute('alt', item.photoAlt.id);
  });

  test('shows title, category, meta, details, the photo and the gallery', async ({ page }) => {
    const { work, ui } = siteContent();
    // The item with the most gallery images, so the gallery is checked whenever the content has one.
    const index = work.items.reduce((best, item, i) => (item.gallery.length > work.items[best].gallery.length ? i : best), 0);
    const item = work.items[index];
    await gotoStatic(page);
    await page.locator('.w-card').nth(index).click();
    await expectOpen(page);
    await expect(page.getByRole('dialog', { name: item.title.en })).toBeVisible();
    // The tag is upper-cased by CSS and innerText follows it.
    await expect(body(page)).toContainText(new RegExp(containing(ui.categories[item.category].en).source, 'i'), {
      useInnerText: true,
    });
    await expect(body(page)).toContainText(item.meta.en, { useInnerText: true });
    await expect(body(page)).toContainText(item.details.en, { useInnerText: true });
    // The main photo, then the gallery.
    const images = page.locator('.lightbox-body img');
    await expect(images).toHaveCount(1 + item.gallery.length);
    expect(await images.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('alt')))).toEqual([
      item.photoAlt.en,
      ...item.gallery.map((shot) => shot.alt.en),
    ]);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('loading', 'lazy');
    }
    await expect.poll(() => images.first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
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
    await anyCard(page).click();
    await expectOpen(page);
    await page.locator('.lightbox-body .lb-title').click();
    await expectOpen(page);
  });

  test('a drag that starts inside and ends on the backdrop does not close it', async ({ page }) => {
    await gotoStatic(page);
    await anyCard(page).click();
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
      const card = anyCard(page);
      await card.click();
      await expectOpen(page);
      const close = page.locator('#lightbox button.lightbox-close');
      await expect(close.locator('[data-l]:visible')).toHaveText(siteContent().ui.close[lang]);
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
      test.skip(!hasWork(), 'uses a What I Do card, whose details are long text');
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      // Real details can be short, so the first card's are made long enough to need scrolling.
      await page.evaluate(() => {
        const template = document.getElementById('lb-work-1') as HTMLTemplateElement;
        for (const text of template.content.querySelectorAll('.lb-text [data-l]')) {
          text.textContent = `${text.textContent} `.repeat(12);
        }
      });
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
