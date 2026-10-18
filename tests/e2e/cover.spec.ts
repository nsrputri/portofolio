import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { plain, siteContent } from './helpers/content';
import { measureContrast } from './helpers/contrast';
import { FIRST_SCREENS, KEY_INFO_ONLY } from './helpers/viewports';

/** Where the cover's look is checked: a full laptop and phone screen, and the shortest windows. */
const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 360, height: 780 },
  { width: 1366, height: 657 },
  { width: 1280, height: 650 },
  { width: 390, height: 664 },
  { width: 360, height: 640 },
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

/** The file at `href` is really a PDF, not the not-found page or the home page under a .pdf name. */
async function expectPdf(request: APIRequestContext, href: string) {
  const response = await request.get(href);
  expect(response.status(), href).toBe(200);
  expect(response.headers()['content-type'], href).toBe('application/pdf');
  expect((await response.body()).subarray(0, 5).toString('latin1'), `${href} starts like a PDF`).toBe('%PDF-');
}

async function boxOf(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('expected a bounding box');
  return box;
}

// The name, the CV button and the status are what a recruiter came for, so they are on the first
// screen in every window, the shortest included.
for (const viewport of [...FIRST_SCREENS, ...KEY_INFO_ONLY]) {
  test.describe(`cover key info at ${viewport.width}x${viewport.height}`, () => {
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
        const { site } = siteContent();
        await expect(pieces.sticker).toContainText(site.name);
        await expect(pieces.status).toHaveText(site.status[lang], { useInnerText: true });
      });
    }
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`cover at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const lang of LANGS) {
      test(`toggle does not overlap corner label (${lang})`, async ({ page }) => {
        await openIn(page, lang);
        const toggle = await boxOf(page.locator('.lang-toggle'));
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
        // With a cover photo, what is measured is the photo under its dark overlay.
        const advice = siteContent().site.coverPhoto
          ? ' (the cover photo is too bright behind this text: use a darker photo, or darken the overlay in .cover-bg::after in src/components/Cover.astro)'
          : '';
        for (const result of await measureContrast(page, selectors)) {
          const needed = result.large ? 3 : 4.5;
          // Soft, so one run lists every element that falls short.
          expect
            .soft(result.ratio, `${result.selector}: ${result.color} ${result.fontPx}px on ${result.worstBackground}${advice}`)
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
    const { site, ui } = siteContent();
    const link = visibleCvLink(page);
    await expect(link).toHaveAttribute('href', site.cv.en);
    await expect(link).toHaveAttribute('download', '');
    await expect(link).toContainText(ui.downloadCv.en);
    await expectPdf(page.request, site.cv.en);

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(link).toHaveAttribute('href', site.cv.id);
    await expect(link).toHaveAttribute('download', '');
    await expect(link).toContainText(ui.downloadCv.id);
    await expectPdf(page.request, site.cv.id);
  });

  // components.test.ts renders both cases from fixtures; this checks the one the content uses.
  test('cover shows the cover photo, or the gradient when there is none', async ({ page }) => {
    const cover = page.locator('header.cover');
    const backdrop = page.locator('.cover-bg img');
    if (siteContent().site.coverPhoto) {
      await expect(cover).not.toHaveClass(/(^|\s)cover--fallback(\s|$)/);
      await expect(backdrop).toHaveCount(1);
      await expect.poll(() => backdrop.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(cover).toHaveClass(/(^|\s)cover--fallback(\s|$)/);
      await expect(backdrop).toHaveCount(0);
    }
  });

  test('tagline is the only h1', async ({ page }) => {
    const { tagline } = siteContent().site;
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(plain(tagline.en), { useInnerText: true });
    await idButton(page).click();
    await expect(h1).toHaveText(plain(tagline.id), { useInnerText: true });
  });

  test('portrait alt follows language', async ({ page }) => {
    const { portraitAlt } = siteContent().site;
    const portrait = page.locator('.cover .polaroid img');
    await expect(portrait).toHaveAttribute('data-alt-en', portraitAlt.en);
    await expect(portrait).toHaveAttribute('data-alt-id', portraitAlt.id);
    await expect(portrait).toHaveAttribute('alt', portraitAlt.en);
    await idButton(page).click();
    await expect(portrait).toHaveAttribute('alt', portraitAlt.id);
  });

  test('meta tags', async ({ page }) => {
    const { title, description } = siteContent().site;
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\/og\.png$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/.+\/$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title.en);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description.en);
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

  // The Indonesian tagline is longer, so it is the one that would run under the collage. The short
  // windows are where the note, resting on the folders, comes closest to the tagline.
  for (const viewport of [...FIRST_SCREENS.filter((v) => v.width > 880), { width: 900, height: 700 }]) {
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
