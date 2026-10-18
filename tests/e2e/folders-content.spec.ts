import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoStatic, noHorizontalScroll } from './helpers/page';

const IDS = ['about', 'study', 'work', 'cert'] as const;
const LABELS = {
  en: ['About Me', 'Study Journey', 'What I Do', 'Certificates'],
  id: ['Tentang Aku', 'Perjalanan Kuliah', 'Yang Aku Lakukan', 'Sertifikat'],
} as const;
const LANGS = ['en', 'id'] as const;

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });

async function boxOf(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('expected a bounding box');
  return box;
}

test.describe('folder shell', () => {
  test('four folders in order with localized tabs', async ({ page }) => {
    await gotoStatic(page);
    const folders = page.locator('main.stack > section.folder');
    await expect(folders).toHaveCount(4);
    expect(await folders.evaluateAll((els) => els.map((el) => el.id))).toEqual([...IDS]);

    // Only the label of the active language is displayed, so ":visible" picks it.
    const labels = page.locator('main.stack > section.folder .folder-tab [data-l]:visible');
    await expect(labels).toHaveText([...LABELS.en]);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(labels).toHaveText([...LABELS.id]);
  });

  test('every folder has the structure the open/close animation relies on', async ({ page }) => {
    await gotoStatic(page);
    for (const [index, id] of IDS.entries()) {
      const folder = page.locator(`main.stack > section.folder#${id}`);
      await expect(folder, id).toHaveAttribute('data-index', String(index));
      await expect(folder.locator('button.folder-tab'), id).toHaveCount(1);
      await expect(folder.locator('button.folder-tab .no'), id).toHaveText(`0${index + 1}`);
      await expect(folder.locator('div.folder-body > div.folder-content'), id).toHaveCount(1);
    }
  });

  test('folder colours and tab sides', async ({ page }) => {
    await gotoStatic(page);
    const expected = [
      { id: 'about', color: 'rgb(232, 200, 194)', tab: 'left' },
      { id: 'study', color: 'rgb(218, 211, 195)', tab: 'right' },
      { id: 'work', color: 'rgb(188, 202, 213)', tab: 'left' },
      { id: 'cert', color: 'rgb(241, 230, 185)', tab: 'right' },
    ];
    for (const { id, color, tab } of expected) {
      const folder = page.locator(`#${id}`);
      await expect(folder.locator('.folder-body'), id).toHaveCSS('background-color', color);
      // The tab is the same paper as the body, so it reads as one folder.
      await expect(folder.locator('.folder-tab'), id).toHaveCSS('background-color', color);
      await expect(folder, id).toHaveAttribute('data-tab', tab);
    }
  });

  // Folders overlap, so the next folder's tab is drawn over the bottom of the open one above it.
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 360, height: 780 },
  ]) {
    for (const lang of LANGS) {
      test(`open folders leave room for the next tab at ${viewport.width}px (${lang})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoStatic(page);
        if (lang === 'id') await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);

        for (const [current, next] of [
          ['about', 'study'],
          ['study', 'work'],
        ]) {
          const gap = await page.evaluate(
            ([cur, nxt]) => {
              const bottoms = [...document.querySelectorAll(`#${cur} .folder-content *`)]
                .map((el) => el.getBoundingClientRect())
                .filter((rect) => rect.height > 0)
                .map((rect) => rect.bottom);
              const tabTop = document.querySelector(`#${nxt} .folder-tab`)!.getBoundingClientRect().top;
              return tabTop - Math.max(...bottoms);
            },
            [current, next],
          );
          expect(gap, `${current} content to the ${next} tab`).toBeGreaterThanOrEqual(0);
        }
      });
    }
  }
});

/** Where the closed stack starts, and the sizes it is built from (custom properties holding clamp() are resolved with a probe). */
async function stackMetrics(page: Page) {
  return page.evaluate(() => {
    const px = (value: string) => {
      const probe = document.createElement('div');
      probe.style.cssText = `position:absolute;visibility:hidden;height:${value}`;
      document.body.append(probe);
      const height = probe.getBoundingClientRect().height;
      probe.remove();
      return height;
    };
    return {
      stackTop: document.querySelector('main.stack')!.getBoundingClientRect().top + window.scrollY,
      band: px('var(--V)'),
      tabHeight: px('var(--tab-h)'),
      viewportHeight: window.innerHeight,
    };
  });
}

// The first screen is the cover with the four closed folders stacked along its bottom edge, so
// every tab has to be on screen without scrolling, in the longer Indonesian copy too.
test.describe('cover and folder stack', () => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 360, height: 780 },
  ]) {
    for (const lang of LANGS) {
      test(`all four closed tabs fit the first screen at ${viewport.width}x${viewport.height} (${lang})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoStatic(page);
        if (lang === 'id') await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        const { stackTop, band, tabHeight, viewportHeight } = await stackMetrics(page);
        // Closed folders are one band apart, so the fourth tab ends 3 bands and a tab below the stack top.
        expect(stackTop + 3 * band + tabHeight, 'bottom of the fourth tab').toBeLessThanOrEqual(viewportHeight);
      });
    }
  }

  // The note rests on the stack and may tuck a little behind the first folder, but never lose a line:
  // the folder's paper sheet is the first opaque thing below the stack top, 14px above its body.
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 800 },
    { width: 1000, height: 700 },
    { width: 900, height: 700 },
  ]) {
    for (const lang of LANGS) {
      test(`note text stays above the first folder at ${viewport.width}x${viewport.height} (${lang})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoStatic(page);
        if (lang === 'id') await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('.cover .note'), 'the note is shown at this width').toBeVisible();
        const { stackTop, tabHeight } = await stackMetrics(page);
        const textBottom = await page.evaluate(() => {
          const text = [...document.querySelectorAll<HTMLElement>('.cover .note p [data-l]')].find((el) => el.offsetParent !== null)!;
          const range = document.createRange();
          range.selectNodeContents(text);
          return Math.max(...[...range.getClientRects()].map((rect) => rect.bottom));
        });
        expect(textBottom, 'last line of the note').toBeLessThanOrEqual(stackTop + tabHeight - 14);
      });

      test(`note leaves the identity row uncovered at ${viewport.width}x${viewport.height} (${lang})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoStatic(page);
        if (lang === 'id') await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        const note = await boxOf(page.locator('.cover .note'));
        for (const selector of ['.cover .sticker', '.cover .cv-link:visible', '.cover .status']) {
          const box = await boxOf(page.locator(selector));
          const overlaps = note.x < box.x + box.width && box.x < note.x + note.width && note.y < box.y + box.height && box.y < note.y + note.height;
          expect(overlaps, `${selector} ${JSON.stringify(box)} vs note ${JSON.stringify(note)}`).toBe(false);
        }
      });
    }
  }

  test('note gives way to the identity row on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await gotoStatic(page);
    await expect(page.locator('.cover .note')).toHaveCount(1);
    await expect(page.locator('.cover .note')).toBeHidden();
    await expect(page.locator('.cover .status')).toBeVisible();
  });
});

test.describe('about me', () => {
  test('about shows facts and skills', async ({ page }) => {
    await gotoStatic(page);
    await expect(page.locator('#about .facts > div')).toHaveCount(4);
    await expect(page.locator('#about .chips li')).toHaveCount(5);
  });

  test('about text follows the language', async ({ page }) => {
    await gotoStatic(page);
    const kicker = page.locator('#about .kicker [data-l]:visible');
    const emphasis = page.locator('#about h2 em:visible');
    const firstFact = page.locator('#about .facts dt [data-l]:visible').first();
    const photo = page.locator('#about .polaroid img');
    const caption = page.locator('#about .polaroid figcaption [data-l]:visible');

    await expect(kicker).toHaveText('// about me');
    await expect(emphasis).toHaveText('Your Name');
    await expect(firstFact).toHaveText('Campus');
    await expect(caption).toHaveText("hi, it's me!");
    await expect(photo).toHaveAttribute('alt', 'Placeholder photo of the site owner');

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(kicker).toHaveText('// tentang aku');
    await expect(emphasis).toHaveText('Nama Kamu');
    await expect(firstFact).toHaveText('Kampus');
    await expect(caption).toHaveText('hai, ini aku!');
    await expect(photo).toHaveAttribute('alt', 'Foto pemilik situs (contoh)');
  });

  test('cassette shows the favourite song on a wide screen and is decorative', async ({ page }) => {
    await gotoStatic(page);
    const cassette = page.locator('#about .cassette');
    await expect(cassette).toBeVisible();
    await expect(cassette).toHaveAttribute('aria-hidden', 'true');
    await expect(cassette).toContainText('now playing ♪ Judul Lagu Favorit');
  });

  // The cassette sits in the bottom right corner of the folder, where the last row of chips could run into it.
  for (const width of [981, 1100, 1280, 1440]) {
    for (const lang of LANGS) {
      test(`cassette does not cover the text at ${width}px (${lang})`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await gotoStatic(page);
        if (lang === 'id') await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('#about .cassette')).toBeVisible();

        const covered = await page.evaluate(() => {
          const cassette = document.querySelector('#about .cassette')!.getBoundingClientRect();
          const touches = (rect: DOMRect) =>
            rect.width > 0 &&
            rect.left < cassette.right &&
            cassette.left < rect.right &&
            rect.top < cassette.bottom &&
            cassette.top < rect.bottom;
          const hits: string[] = [];
          for (const el of document.querySelectorAll('#about .about > div:not(.cassette) :is(h2, .body-txt, dt, dd, li)')) {
            // A chip is its pill; the other pieces are as wide as their column, so only their text lines count.
            const range = document.createRange();
            range.selectNodeContents(el);
            const boxes = el.matches('li') ? [el.getBoundingClientRect()] : [...range.getClientRects()];
            if (boxes.some(touches)) hits.push(el.textContent!.trim().slice(0, 30));
          }
          return hits;
        });
        expect(covered).toEqual([]);
      });
    }
  }

  test('cassette is hidden where it would crowd the text', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await gotoStatic(page);
    // Present in the page but not displayed (a missing element would also count as hidden).
    await expect(page.locator('#about .cassette')).toHaveCount(1);
    await expect(page.locator('#about .cassette')).toBeHidden();
  });
});

test.describe('study journey', () => {
  test('study marks the current item', async ({ page }) => {
    await gotoStatic(page);
    const items = page.locator('#study .timeline li');
    await expect(items).not.toHaveCount(0);
    await expect(page.locator('#study .timeline li.now')).toHaveCount(1);
    await expect(items.last()).toHaveClass(/(^|\s)now(\s|$)/);
    await expect(items.last()).toHaveAttribute('aria-current', 'step');
  });

  test('study text follows the language', async ({ page }) => {
    await gotoStatic(page);
    const kicker = page.locator('#study .kicker [data-l]:visible');
    const firstTitle = page.locator('#study .timeline li').first().locator('b [data-l]:visible');
    const emphasis = page.locator('#study h2 em:visible');

    await expect(kicker).toHaveText('// study journey');
    await expect(firstTitle).toHaveText('Started at TRI UGM');
    await expect(emphasis).toHaveText('“what is an IP address?”');

    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(kicker).toHaveText('// perjalanan kuliah');
    await expect(firstTitle).toHaveText('Masuk TRI UGM');
    await expect(emphasis).toHaveText('“apa itu IP address?”');
  });
});

test.describe('on a phone (360px)', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const lang of LANGS) {
    test(`folders do not scroll sideways (${lang})`, async ({ page }) => {
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('main.stack > section.folder')).toHaveCount(4);

      expect(await noHorizontalScroll(page)).toBe(true);
      // <body> has overflow-x: clip, which hides overflow from scrollWidth, so the boxes are checked too.
      const wide = await page.evaluate(() =>
        [...document.querySelectorAll('main.stack *')]
          .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      );
      expect(wide).toEqual([]);
    });
  }
});

// axe cannot resolve gradients but the folders are flat colours, so it can check the real pairs here.
test.describe('contrast in the folders', () => {
  for (const lang of LANGS) {
    test(`text meets WCAG AA (${lang})`, async ({ page }) => {
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      const { violations } = await new AxeBuilder({ page }).include('main.stack').withRules(['color-contrast']).analyze();
      expect(
        violations.flatMap((violation) =>
          violation.nodes.map((node) => `${node.target.join(' ')}: ${node.any[0]?.message ?? violation.help}`),
        ),
      ).toEqual([]);
    });
  }
});
