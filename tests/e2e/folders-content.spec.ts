import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { gotoStatic, noHorizontalScroll } from './helpers/page';

const IDS = ['about', 'study', 'work', 'cert'] as const;
const LABELS = {
  en: ['About Me', 'Study Journey', 'What I Do', 'Certificates'],
  id: ['Tentang Aku', 'Perjalanan Kuliah', 'Yang Aku Lakukan', 'Sertifikat'],
} as const;
const LANGS = ['en', 'id'] as const;

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });

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

// The closed stack lies over the bottom of the cover, so the cover has to leave the note room above it.
test.describe('cover and folder stack', () => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 900, height: 700 },
    { width: 681, height: 800 },
  ]) {
    for (const lang of LANGS) {
      test(`note ends above the first folder at ${viewport.width}x${viewport.height} (${lang})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoStatic(page);
        if (lang === 'id') await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        const note = await page.locator('.cover .note').boundingBox();
        const stack = await page.locator('main.stack').boundingBox();
        expect(note, 'the note is shown at this width').not.toBeNull();
        expect(note!.y + note!.height, 'note bottom to the top of the stack').toBeLessThanOrEqual(stack!.y);
      });
    }
  }
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
