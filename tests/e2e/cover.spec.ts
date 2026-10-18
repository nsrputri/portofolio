import { test, expect, type Locator, type Page } from '@playwright/test';
import { measureContrast } from './helpers/contrast';

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 360, height: 780 },
] as const;

const LANGS = ['en', 'id'] as const;

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });
/** The CV link of the current language. The cover is scoped because the footer has a second pair. */
const visibleCvLink = (page: Page) => page.locator('.cover .cv-link:visible');

/** Starts the page with a stored language, the same way a returning visitor would have one. */
async function openIn(page: Page, lang: (typeof LANGS)[number]) {
  await page.addInitScript((value) => localStorage.setItem('lang', value), lang);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
}

async function boxOf(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('expected a bounding box');
  return box;
}

for (const viewport of VIEWPORTS) {
  test.describe(`cover at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const lang of LANGS) {
      test(`key info visible in the first viewport (${lang})`, async ({ page }) => {
        await openIn(page, lang);
        const pieces = {
          sticker: page.locator('.cover .sticker'),
          'CV link': visibleCvLink(page),
          status: page.locator('.cover .status'),
        };
        for (const [name, locator] of Object.entries(pieces)) {
          const box = await boxOf(locator);
          expect(box.y, `${name} top`).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(viewport.height);
          expect(box.x, `${name} left`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${name} right`).toBeLessThanOrEqual(viewport.width);
        }
        await expect(pieces.sticker).toContainText('NAMA KAMU');
        await expect(pieces.status).toHaveText(lang === 'en' ? 'Open to internship' : 'Terbuka untuk magang', {
          useInnerText: true,
        });
      });

      test(`toggle does not overlap corner label (${lang})`, async ({ page }) => {
        await openIn(page, lang);
        const toggle = await boxOf(page.locator('[role="group"]:has([data-set-lang])'));
        const corner = await boxOf(page.locator('.cover-corner--right'));
        const overlaps =
          toggle.x < corner.x + corner.width &&
          corner.x < toggle.x + toggle.width &&
          toggle.y < corner.y + corner.height &&
          corner.y < toggle.y + toggle.height;
        expect(overlaps, `toggle ${JSON.stringify(toggle)} vs corner ${JSON.stringify(corner)}`).toBe(false);
        expect(corner.x + corner.width).toBeLessThanOrEqual(viewport.width);
      });

      // axe cannot resolve gradients, so this reads the rendered pixels behind each piece of text.
      test(`cover text meets WCAG AA contrast (${lang})`, async ({ page }) => {
        await openIn(page, lang);
        const selectors = [
          '.cover-corner--left',
          '.cover-corner--right',
          '.cover-title',
          '.cover .status [data-l]',
          '.cover .cv-link',
          '.cover .sticker b',
          '.cover .sticker small',
          // The note is hidden on a phone.
          ...(viewport.width > 680 ? ['.cover .note p'] : []),
        ];
        for (const result of await measureContrast(page, selectors)) {
          const needed = result.large ? 3 : 4.5;
          // Soft, so one run lists every element that falls short.
          expect
            .soft(result.ratio, `${result.selector}: ${result.color} ${result.fontPx}px on ${result.worstBackground}`)
            .toBeGreaterThanOrEqual(needed);
        }
      });
    }
  });
}

test.describe('cover content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('CV link follows language', async ({ page }) => {
    const link = visibleCvLink(page);
    await expect(link).toHaveAttribute('href', '/cv/cv-en.pdf');
    await expect(link).toHaveAttribute('download', '');
    await expect(link).toHaveText(/Download CV/);
    expect((await page.request.get('/cv/cv-en.pdf')).status()).toBe(200);

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(link).toHaveAttribute('href', '/cv/cv-id.pdf');
    await expect(link).toHaveAttribute('download', '');
    await expect(link).toHaveText(/Unduh CV/);
    const href = await link.getAttribute('href');
    expect((await page.request.get(href!)).status()).toBe(200);
  });

  test('cover falls back to gradient without a cover photo', async ({ page }) => {
    await expect(page.locator('header.cover')).toHaveClass(/(^|\s)cover--fallback(\s|$)/);
    await expect(page.locator('.cover-bg img')).toHaveCount(0);
  });

  test('tagline is the only h1', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('stay curious, stay connected', { useInnerText: true });
    await idButton(page).click();
    await expect(h1).toHaveText('tetap penasaran, tetap terhubung', { useInnerText: true });
  });

  test('portrait alt follows language', async ({ page }) => {
    const portrait = page.locator('.cover .polaroid img');
    const altEn = await portrait.getAttribute('data-alt-en');
    const altId = await portrait.getAttribute('data-alt-id');
    expect(altEn).toBeTruthy();
    expect(altId).toBeTruthy();
    expect(altId).not.toBe(altEn);
    await expect(portrait).toHaveAttribute('alt', altEn!);
    await idButton(page).click();
    await expect(portrait).toHaveAttribute('alt', altId!);
  });

  test('meta tags', async ({ page }) => {
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\/og\.png$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/.+\/$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Internet Engineering Portfolio/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /Portfolio of an Internet Engineering/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical!);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });
});

test.describe('cover decorations', () => {
  test('polaroid and note show on desktop', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cover .polaroid')).toBeVisible();
    await expect(page.locator('.cover .note')).toBeVisible();
  });

  // The Indonesian tagline is longer, so it is the one that would run under the collage.
  for (const viewport of [VIEWPORTS[0], { width: 900, height: 700 }]) {
    for (const lang of LANGS) {
      test.describe(`at ${viewport.width}x${viewport.height} in ${lang}`, () => {
        test.use({ viewport });

        test('polaroid and note stay clear of the tagline', async ({ page }) => {
          await openIn(page, lang);
          const tagline = await page.evaluate(() => {
            const h1 = document.querySelector('.cover-title')!;
            const visible = [...h1.querySelectorAll<HTMLElement>('[data-l]')].find((el) => el.offsetParent !== null)!;
            const range = document.createRange();
            range.selectNodeContents(visible);
            const lines = [...range.getClientRects()].filter((rect) => rect.width > 0);
            return { textRight: Math.max(...lines.map((rect) => rect.right)), bottom: h1.getBoundingClientRect().bottom };
          });
          const polaroid = await boxOf(page.locator('.cover .polaroid'));
          const note = await boxOf(page.locator('.cover .note'));
          expect(polaroid.x, 'polaroid is right of the tagline text').toBeGreaterThanOrEqual(tagline.textRight);
          expect(note.y, 'note is below the tagline').toBeGreaterThanOrEqual(tagline.bottom);
        });
      });
    }
  }

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 360, height: 780 } });

    test('polaroid and note are hidden', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.cover .polaroid')).toHaveCount(1);
      await expect(page.locator('.cover .note')).toHaveCount(1);
      await expect(page.locator('.cover .polaroid')).toBeHidden();
      await expect(page.locator('.cover .note')).toBeHidden();
    });
  });
});
