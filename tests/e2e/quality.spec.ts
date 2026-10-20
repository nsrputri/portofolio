import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { shownFolders, siteContent } from './helpers/content';
import { gotoStatic, idle, noHorizontalScroll, openIds } from './helpers/page';

const LANGS = ['en', 'id'] as const;

const idButton = (page: Page) => page.getByRole('button', { name: 'ID', exact: true });

/** Violations as `rule: target, target`, so a failure names what to fix. */
async function axeViolations(page: Page, impacts: ('serious' | 'critical')[] = ['serious', 'critical']): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact && (impacts as string[]).includes(v.impact))
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

/** Scrolls down until every folder has opened, then to the very bottom, and lets the page settle. */
async function openEverythingByScrolling(page: Page): Promise<void> {
  // Each folder that opens makes the page longer, so keep going down until all four are open.
  for (let pass = 0; pass < 16 && (await openIds(page)).length < shownFolders().length; pass++) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await idle(page);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await idle(page);
}

test.describe('small screens', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('no horizontal scroll at 360px in en and id', async ({ page }) => {
    await gotoStatic(page);
    expect(await noHorizontalScroll(page), 'en').toBe(true);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    expect(await noHorizontalScroll(page), 'id').toBe(true);
  });

  for (const lang of LANGS) {
    test(`no horizontal scroll at 360px with motion on, closed and scrolled to the end (${lang})`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('lang', value), lang);
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await idle(page);
      expect(await openIds(page)).toEqual([]);
      expect(await noHorizontalScroll(page), 'closed stack').toBe(true);

      await openEverythingByScrolling(page);
      expect(await openIds(page)).toEqual(shownFolders());
      expect(await noHorizontalScroll(page), 'every folder open').toBe(true);
    });
  }

  for (const lang of LANGS) {
    test(`the four folder tabs fit on one line each at 360px (${lang})`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('lang', value), lang);
      await gotoStatic(page);
      for (const tab of await page.locator('.folder-tab').all()) {
        const box = await tab.boundingBox();
        if (!box) throw new Error('folder tab has no box');
        expect(box.x, 'tab left').toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, 'tab right').toBeLessThanOrEqual(360);
        // A tab that wraps its label grows taller than the tab row.
        expect(box.height, 'tab height').toBeLessThanOrEqual(56);
      }
    });
  }
});

// The language toggle floats at the top right of the window. A tab jump scrolls the folder to the top
// of the window, which must leave its tab clear of the toggle (found while comparing with the mockup).
for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test.describe(`language toggle vs folder tabs at ${viewport.width}px`, () => {
    test.use({ viewport });

    for (const id of shownFolders()) {
      test(`the toggle does not cover the ${id} tab after jumping to it`, async ({ page }) => {
        await page.goto('/');
        await idle(page);
        await page.locator(`#${id} .folder-tab`).click();
        await idle(page);
        expect((await openIds(page)).length, 'the tab opened its folder').toBeGreaterThan(shownFolders().indexOf(id));

        const tab = await page.locator(`#${id} .folder-tab`).boundingBox();
        const toggle = await page.locator('.lang-toggle').boundingBox();
        if (!tab || !toggle) throw new Error('tab or toggle has no box');
        // The tab is on screen, and the toggle sits above it or to the side, never on top of it.
        expect(tab.y + tab.height, `${id} tab is on screen`).toBeGreaterThan(0);
        const overlaps =
          tab.x < toggle.x + toggle.width &&
          toggle.x < tab.x + tab.width &&
          tab.y < toggle.y + toggle.height &&
          toggle.y < tab.y + tab.height;
        expect(overlaps, `tab ${JSON.stringify(tab)} vs toggle ${JSON.stringify(toggle)}`).toBe(false);
      });
    }
  });
}

test.describe('accessibility (axe)', () => {
  test('no serious a11y violations in English', async ({ page }) => {
    await gotoStatic(page);
    expect(await axeViolations(page)).toEqual([]);
  });

  test('no serious a11y violations in Indonesian', async ({ page }) => {
    await gotoStatic(page);
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    expect(await axeViolations(page)).toEqual([]);
  });

  for (const lang of LANGS) {
    for (const card of ['.w-card', '.c-card']) {
      test(`no serious a11y violations with the lightbox open on a ${card} (${lang})`, async ({ page }) => {
        const { work, certificates } = siteContent();
        test.skip((card === '.w-card' ? work : certificates).items.length === 0, 'that folder is hidden until it has an item');
        await page.addInitScript((value) => localStorage.setItem('lang', value), lang);
        await gotoStatic(page);
        await page.locator(card).first().click();
        await expect(page.locator('#lightbox')).toHaveJSProperty('open', true);
        expect(await axeViolations(page)).toEqual([]);
      });
    }
  }

  test('the closed stack (motion on) has no serious a11y violations either', async ({ page }) => {
    await page.goto('/');
    await idle(page);
    expect(await openIds(page)).toEqual([]);
    expect(await axeViolations(page)).toEqual([]);
  });

  test('the language label lives in a landmark (axe region)', async ({ page }) => {
    await gotoStatic(page);
    // Moderate, so the serious/critical filter above does not see it: every bit of content belongs
    // to a landmark, the visually hidden "Language" label of the toggle included.
    const { violations } = await new AxeBuilder({ page }).withRules(['region']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    await expect(page.getByRole('region', { name: siteContent().ui.language.en })).toBeVisible();
  });

  test('lists keep their list role although list-style is none', async ({ page }) => {
    await gotoStatic(page);
    // Safari/VoiceOver drop the list semantics of a list without markers unless the role is spelled out.
    for (const selector of ['.timeline', '.chips', '.links']) {
      const lists = await page.locator(selector).all();
      expect(lists.length, selector).toBeGreaterThan(0);
      for (const list of lists) await expect(list, selector).toHaveAttribute('role', 'list');
    }
  });
});

test.describe('images', () => {
  /** Images that are decorative on purpose: the cover backdrop and the card thumbnails (their button has text). */
  const DECORATIVE = '.cover-bg img, .w-card img, .c-card img';

  test('all images have alt in both languages', async ({ page }) => {
    await gotoStatic(page);

    const check = async (lang: (typeof LANGS)[number]) => {
      const problems = await page.evaluate(
        ({ decorative, lang }) => {
          const bad: string[] = [];
          const describe = (img: HTMLImageElement) => img.getAttribute('src')?.split('/').pop() ?? 'img';
          const live = [...document.querySelectorAll<HTMLImageElement>('img')];
          // The lightbox details sit in <template>s until a card is opened; check them as well.
          // Their alt is only synced when they are opened (lightbox.spec.ts checks that).
          const inTemplates = [...document.querySelectorAll('template')].flatMap((t) => [...t.content.querySelectorAll('img')]);
          for (const img of [...live, ...inTemplates]) {
            const alt = img.getAttribute('alt');
            if (alt === null) bad.push(`${describe(img)}: no alt attribute`);
            else if (alt.trim() === '' && !img.matches(decorative)) bad.push(`${describe(img)}: empty alt on a content image`);
            else if (alt.trim() === '' && img.matches('.w-card img, .c-card img') && !img.closest('button')?.textContent?.trim()) {
              bad.push(`${describe(img)}: decorative thumbnail inside a button with no text`);
            }
            const wanted = img.getAttribute(`data-alt-${lang}`);
            if (wanted === null) bad.push(`${describe(img)}: no data-alt-${lang}`);
            else if (live.includes(img) && alt !== wanted) bad.push(`${describe(img)}: alt "${alt}" is not "${wanted}"`);
          }
          return bad;
        },
        { decorative: DECORATIVE, lang },
      );
      expect(problems, lang).toEqual([]);
    };

    await check('en');
    await idButton(page).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await check('id');
    // The Indonesian text really is on the images, not only the English one.
    const sameAlt = await page.evaluate(
      () => [...document.querySelectorAll<HTMLImageElement>('img[data-alt-id]')].filter((i) => i.alt === i.dataset.altId).length,
    );
    expect(sameAlt).toBe(await page.locator('img[data-alt-id]').count());
  });
});

// A visitor whose scripts fail to load (flaky network, blocker, old browser) must still see everything.
test.describe('when the folder script fails', () => {
  test('folder content becomes visible within 5 seconds', async ({ page }) => {
    // Abort whichever module contains the folder code (it carries the data-folders-line hook).
    let blocked = 0;
    await page.route('**/_astro/*.js', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (body.includes('data-folders-line')) {
        blocked += 1;
        await route.abort();
      } else {
        await route.fulfill({ response, body });
      }
    });

    await page.goto('/');
    expect(blocked, 'the folders module was blocked').toBeGreaterThan(0);
    // Motion is on, so until the fallback fires the folder contents are hidden.
    await expect(page.locator('html')).toHaveClass(/(^|\s)has-motion(\s|$)/);
    await expect(page.locator('html')).not.toHaveAttribute('data-folders-line', /.*/);

    for (const id of shownFolders()) {
      await expect(page.locator(`#${id} .folder-content`), id).toBeVisible({ timeout: 5000 });
    }
    await expect(page.locator('html')).not.toHaveClass(/has-motion/);
    // Every folder is open and nothing hangs over the sides.
    for (const id of shownFolders()) {
      const inset = await page.locator(`#${id}`).evaluate((el) => parseFloat(getComputedStyle(el).marginLeft));
      expect(inset, `${id} inset`).toBe(0);
    }
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('a healthy page keeps its closed stack past the 5 second mark', async ({ page }) => {
    await page.goto('/');
    await idle(page);
    await page.waitForTimeout(5000);
    await expect(page.locator('html')).toHaveClass(/(^|\s)has-motion(\s|$)/);
    expect(await openIds(page)).toEqual([]);
    await expect(page.locator('#about .folder-content')).toBeHidden();
  });
});

test.describe('print', () => {
  test('every folder is open on paper, with motion on, and the language toggle is gone', async ({ page }) => {
    await page.goto('/');
    await idle(page);
    expect(await openIds(page)).toEqual([]);
    await expect(page.locator('#about .folder-content')).toBeHidden();

    await page.emulateMedia({ media: 'print' });
    for (const id of shownFolders()) {
      await expect(page.locator(`#${id} .folder-content`), id).toBeVisible();
      const body = await page.locator(`#${id} .folder-body`).evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        content: el.querySelector('.folder-content')!.getBoundingClientRect().height,
      }));
      expect(body.content, `${id} content height`).toBeGreaterThan(40);
      // The body is as tall as its contents: nothing is clipped.
      expect(body.height, `${id} body height`).toBeGreaterThanOrEqual(body.content);
    }
    await expect(page.locator('.lang-toggle')).toBeHidden();
  });
});
