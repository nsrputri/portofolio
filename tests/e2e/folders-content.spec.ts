import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { containing, emphasised, plain, siteContent } from './helpers/content';
import { gotoStatic, noHorizontalScroll } from './helpers/page';
import { FIRST_SCREENS } from './helpers/viewports';

const IDS = ['about', 'study', 'work', 'cert'] as const;
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
    const { folders: names } = siteContent().ui;
    const labels = page.locator('main.stack > section.folder .folder-tab [data-l]:visible');
    await expect(labels).toHaveText(IDS.map((id) => names[id].en));
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(labels).toHaveText(IDS.map((id) => names[id].id));
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
          ['work', 'cert'],
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
  for (const viewport of FIRST_SCREENS) {
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
    // The short windows, where the cover is tightest.
    ...FIRST_SCREENS.filter((v) => v.width > 880 && v.height < 768),
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

  // Real content can have a longer status than the dummy one, and the note sits right next to the
  // identity row at these widths.
  for (const viewport of [
    { width: 900, height: 700 },
    { width: 1024, height: 640 },
  ]) {
    test(`a longer status wraps clear of the note at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await gotoStatic(page);
      await page.evaluate(() => {
        for (const text of document.querySelectorAll('.cover .status [data-l]')) {
          text.textContent = 'Looking for an internship in networking';
        }
      });
      const note = await boxOf(page.locator('.cover .note'));
      const status = await boxOf(page.locator('.cover .status'));
      const sticker = await boxOf(page.locator('.cover .sticker'));
      expect(status.x + status.width, 'status right edge vs note left edge').toBeLessThanOrEqual(note.x);
      // It wraps inside the pill rather than adding a line under the sticker, so the cover keeps its height.
      expect(status.y, 'status stays on the sticker row').toBeLessThan(sticker.y + sticker.height);
      expect(status.y + status.height, 'status bottom').toBeLessThanOrEqual(viewport.height);
    });
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
  test('about shows every fact and skill', async ({ page }) => {
    const { facts, skills } = siteContent().about;
    await gotoStatic(page);
    await expect(page.locator('#about .facts > div')).toHaveCount(facts.length);
    await expect(page.locator('#about .facts dd [data-l]:visible')).toHaveText(facts.map((fact) => fact.value.en));
    await expect(page.locator('#about .chips li')).toHaveText(skills);
  });

  test('about text follows the language', async ({ page }) => {
    const { about } = siteContent();
    await gotoStatic(page);
    const kicker = page.locator('#about .kicker [data-l]:visible');
    const heading = page.locator('#about h2 [data-l]:visible');
    const emphasis = page.locator('#about h2 em:visible');
    const factLabels = page.locator('#about .facts dt [data-l]:visible');
    const photo = page.locator('#about .polaroid img');
    const caption = page.locator('#about .polaroid figcaption [data-l]:visible');

    for (const lang of LANGS) {
      if (lang === 'id') {
        await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'id');
      }
      await expect(kicker, lang).toHaveText(about.kicker[lang]);
      await expect(heading, lang).toHaveText(plain(about.heading[lang]), { useInnerText: true });
      // `*x*` in the heading is set in italics.
      await expect(emphasis, lang).toHaveText(emphasised(about.heading[lang]));
      await expect(factLabels, lang).toHaveText(about.facts.map((fact) => fact.label[lang]));
      await expect(caption, lang).toHaveText(about.caption[lang]);
      await expect(photo, lang).toHaveAttribute('alt', about.photoAlt[lang]);
    }
  });

  test('cassette shows the favourite song on a wide screen and is decorative', async ({ page }) => {
    await gotoStatic(page);
    const cassette = page.locator('#about .cassette');
    await expect(cassette).toBeVisible();
    await expect(cassette).toHaveAttribute('aria-hidden', 'true');
    await expect(cassette).toContainText(`now playing ♪ ${siteContent().about.song}`);
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
  test('study marks the items flagged as current', async ({ page }) => {
    const { items: steps } = siteContent().study;
    await gotoStatic(page);
    const items = page.locator('#study .timeline li');
    await expect(items).toHaveCount(steps.length);
    const marks = await items.evaluateAll((lis) =>
      lis.map((li) => ({ now: li.classList.contains('now'), ariaCurrent: li.getAttribute('aria-current') })),
    );
    expect(marks).toEqual(steps.map((step) => ({ now: step.current, ariaCurrent: step.current ? 'step' : null })));
  });

  test('study text follows the language', async ({ page }) => {
    const { study } = siteContent();
    await gotoStatic(page);
    const kicker = page.locator('#study .kicker [data-l]:visible');
    const titles = page.locator('#study .timeline li b [data-l]:visible');
    const texts = page.locator('#study .timeline li p [data-l]:visible');
    const emphasis = page.locator('#study h2 em:visible');

    for (const lang of LANGS) {
      if (lang === 'id') {
        await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'id');
      }
      await expect(kicker, lang).toHaveText(study.kicker[lang]);
      await expect(titles, lang).toHaveText(study.items.map((item) => item.title[lang]));
      await expect(texts, lang).toHaveText(study.items.map((item) => item.text[lang]));
      // The heading is optional; without one there is no emphasis to find.
      await expect(emphasis, lang).toHaveText(study.heading ? emphasised(study.heading[lang]) : []);
    }
  });
});

test.describe('what I do', () => {
  const cards = (page: Page) => page.locator('#work .w-card');

  test('what I do cards show localized category', async ({ page }) => {
    const { work, ui } = siteContent();
    await gotoStatic(page);
    await expect(cards(page)).toHaveCount(work.items.length);
    const tags = page.locator('#work .w-card .tag [data-l]:visible');
    await expect(tags).toHaveText(work.items.map((item) => ui.categories[item.category].en));
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(tags).toHaveText(work.items.map((item) => ui.categories[item.category].id));
  });

  test('cards are buttons named by their text and wired to a detail template', async ({ page }) => {
    const { work } = siteContent();
    await gotoStatic(page);
    const first = cards(page).first();
    await expect(first).toHaveJSProperty('tagName', 'BUTTON');
    await expect(first).toHaveAttribute('type', 'button');
    await expect(first).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(first).toHaveAccessibleName(containing(work.items[0].title.en));
    // Each card points at its own <template>; the details are not in the page until a card is opened.
    const ids = await cards(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-lightbox')));
    expect(ids).toEqual(work.items.map((_, i) => `lb-work-${i + 1}`));
    for (const id of ids as string[]) {
      expect(await page.evaluate((tid) => document.getElementById(tid)?.tagName, id), id).toBe('TEMPLATE');
    }
  });

  test('what I do text follows the language', async ({ page }) => {
    const { work } = siteContent();
    await gotoStatic(page);
    const kicker = page.locator('#work .kicker [data-l]:visible');
    const emphasis = page.locator('#work h2 em:visible');
    const titles = page.locator('#work .w-card .w-title [data-l]:visible');
    const metas = page.locator('#work .w-card .meta [data-l]:visible');

    for (const lang of LANGS) {
      if (lang === 'id') {
        await idButton(page).click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'id');
      }
      await expect(kicker, lang).toHaveText(work.kicker[lang]);
      await expect(emphasis, lang).toHaveText(emphasised(work.heading[lang]));
      await expect(titles, lang).toHaveText(work.items.map((item) => item.title[lang]));
      await expect(metas, lang).toHaveText(work.items.map((item) => item.meta[lang]));
    }
  });

  test('the binder clip is decoration', async ({ page }) => {
    await gotoStatic(page);
    await expect(page.locator('#work .binder')).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('certificates', () => {
  const cards = (page: Page) => page.locator('#cert .c-card');

  test('certificates numbered in order', async ({ page }) => {
    const { items } = siteContent().certificates;
    await gotoStatic(page);
    await expect(cards(page)).toHaveCount(items.length);
    await expect(page.locator('.c-card .c-no')).toHaveText(items.map((_, i) => String(i + 1).padStart(2, '0')));
  });

  test('cards show title, issuer and year, tilted in turn', async ({ page }) => {
    const { items } = siteContent().certificates;
    await gotoStatic(page);
    await expect(cards(page).locator('.c-title')).toHaveText(items.map((cert) => cert.title));
    await expect(cards(page).locator('.c-meta')).toHaveText(items.map((cert) => `${cert.issuer} · ${cert.year}`));
    // The card is a button named by the text on it (its thumbnail is decorative).
    await expect(cards(page).first()).toHaveAccessibleName(containing(items[0].title));
    const tilts = await cards(page).evaluateAll((els) => els.map((el) => (el as HTMLElement).style.getPropertyValue('--r')));
    const TILTS = ['-3deg', '2deg', '-1.5deg', '3deg'];
    expect(tilts).toEqual(items.map((_, i) => TILTS[i % TILTS.length]));
    const ids = await cards(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-lightbox')));
    expect(ids).toEqual(items.map((_, i) => `lb-cert-${i + 1}`));
    await expect(cards(page).first()).toHaveJSProperty('tagName', 'BUTTON');
    await expect(cards(page).first().locator('.clip')).toHaveAttribute('aria-hidden', 'true');
  });

  test('the board title is the same English decor in both languages', async ({ page }) => {
    await gotoStatic(page);
    const title = page.locator('#cert .board-title');
    await expect(title).toHaveText('CERTIFICATES >>>>');
    await expect(title).toHaveCSS('font-family', /Silkscreen/);
    await expect(title).toHaveCSS('color', 'rgb(255, 255, 255)');
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(title).toHaveText('CERTIFICATES >>>>');
  });

  test('the board is blue with pink clips', async ({ page }) => {
    await gotoStatic(page);
    await expect(page.locator('#cert .board')).toHaveCSS('background-color', 'rgb(47, 111, 224)');
    await expect(cards(page).first().locator('.clip')).toHaveCSS('background-color', 'rgb(238, 94, 169)');
  });
});

/**
 * Elements in the folders that reach past the right edge of the window. The page width alone only
 * says that something sticks out; this also catches a box cut off by an ancestor that clips its
 * overflow, and names the culprit.
 */
async function boxesPastTheRightEdge(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('main.stack *')]
      .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
  );
}

test.describe('on a phone (360px)', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const lang of LANGS) {
    test(`folders do not scroll sideways (${lang})`, async ({ page }) => {
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('main.stack > section.folder')).toHaveCount(4);

      expect(await noHorizontalScroll(page)).toBe(true);
      expect(await boxesPastTheRightEdge(page)).toEqual([]);
    });

    // Real content can hold a string with no place to break (an e-mail address, a long compound word)
    // where the dummy text has short words.
    test(`a long unbroken fact or step title wraps instead of sticking out (${lang})`, async ({ page }) => {
      await gotoStatic(page);
      if (lang === 'id') await idButton(page).click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      const filled = await page.evaluate(() => {
        const targets = document.querySelectorAll('#about .facts dd [data-l], #study .timeline b [data-l]');
        for (const el of targets) el.textContent = 'nama.lengkap.mahasiswa@mail.ugm.example.ac.id';
        return targets.length;
      });
      expect(filled, 'facts and step titles to fill').toBeGreaterThan(0);

      expect(await noHorizontalScroll(page)).toBe(true);
      expect(await boxesPastTheRightEdge(page)).toEqual([]);
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
