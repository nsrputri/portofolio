import { test, expect, type Page } from '@playwright/test';
import { shownFolders } from './helpers/content';
import { gotoStatic, idle, openIds } from './helpers/page';
import { FIRST_SCREENS } from './helpers/viewports';

/** The open line folders.ts is using, in px from the top of the viewport. */
async function openLine(page: Page): Promise<number> {
  const value = await page.locator('html').getAttribute('data-folders-line');
  expect(value, 'html[data-folders-line]').not.toBeNull();
  return Number(value);
}

/** Document top of a folder. A folder opening or closing never moves its own top. */
async function docTop(page: Page, id: string): Promise<number> {
  return page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
}

async function viewTop(page: Page, id: string): Promise<number> {
  return page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
}

async function scrollTo(page: Page, y: number): Promise<void> {
  await page.evaluate((top) => window.scrollTo(0, top), y);
}

/** Scrolls so About's top sits `offset` px below the open line (negative: above it). */
async function putAboutAt(page: Page, offset: number): Promise<void> {
  const top = await docTop(page, 'about');
  await scrollTo(page, top - ((await openLine(page)) + offset));
}

/**
 * Scrolls to the bottom in 150px steps, letting the folders settle after each step, and checks at
 * every step that the open folders are a prefix of the stack (they open in order).
 */
async function scrollDownInSteps(page: Page): Promise<void> {
  for (let step = 0; step < 300; step++) {
    const open = await openIds(page);
    expect(open, `open folders at step ${step}`).toEqual(shownFolders().slice(0, open.length));
    const atBottom = await page.evaluate(
      () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1,
    );
    if (atBottom) return;
    await page.evaluate(() => window.scrollBy(0, 150));
    await idle(page);
  }
  throw new Error('never reached the bottom of the page');
}

test.describe('folder motion', () => {
  test('closed stack at load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/(^|\s)has-motion(\s|$)/);
    await idle(page);
    expect(await openIds(page)).toEqual([]);
    for (const id of shownFolders()) {
      // Inset 3.5vw on each side, with the contents out of sight.
      const inset = await page.locator(`#${id}`).evaluate((el) => {
        const style = getComputedStyle(el);
        return { left: parseFloat(style.marginLeft), right: parseFloat(style.marginRight), want: window.innerWidth * 0.035 };
      });
      expect(inset.left, `${id} left inset`).toBeCloseTo(inset.want, 0);
      expect(inset.right, `${id} right inset`).toBeCloseTo(inset.want, 0);
      await expect(page.locator(`#${id} .folder-content`), `${id} contents`).toBeHidden();
    }
  });

  test('scrolling down opens in order', async ({ page }) => {
    await page.goto('/');
    await scrollDownInSteps(page);
    await expect.poll(() => openIds(page)).toEqual(shownFolders());
  });

  test('scrolling back to top closes all', async ({ page }) => {
    await page.goto('/');
    await scrollDownInSteps(page);
    await expect.poll(() => openIds(page)).toEqual(shownFolders());
    await scrollTo(page, 0);
    await expect.poll(() => openIds(page), { timeout: 10_000 }).toEqual([]);
  });

  test('hysteresis band holds', async ({ page }) => {
    await page.goto('/');
    await putAboutAt(page, -10);
    await idle(page);
    expect(await openIds(page)).toEqual(['about']);

    await putAboutAt(page, 24);
    await idle(page);
    // Inside the band nothing may happen, so watch it for a while rather than looking once.
    for (let i = 0; i < 15; i++) {
      expect(await openIds(page), `after ${i * 100}ms in the band`).toEqual(['about']);
      await page.waitForTimeout(100);
    }

    await putAboutAt(page, 70);
    await idle(page);
    expect(await openIds(page)).toEqual([]);
  });

  test('a settled folder hands its styles back to CSS', async ({ page }) => {
    await page.goto('/');
    await putAboutAt(page, -10);
    await idle(page);
    expect(await openIds(page)).toEqual(['about']);
    const open = await page.locator('#about').evaluate((el) => {
      const body = el.querySelector<HTMLElement>('.folder-body')!;
      const content = el.querySelector<HTMLElement>('.folder-content')!;
      const pops = [...el.querySelectorAll<HTMLElement>('.pop')];
      return {
        folderStyle: el.style.marginLeft + el.style.marginRight,
        bodyStyle: body.style.height + body.style.overflow,
        bodyClipped: body.scrollHeight - body.clientHeight > 1,
        contentStyle: content.style.opacity + content.style.visibility,
        popStyle: pops.map((pop) => pop.style.transform + pop.style.opacity + pop.style.rotate + pop.style.translate).join(''),
        // GSAP folds the CSS `rotate` tilt into its transform while it animates; the tilt must come back.
        polaroidRotate: getComputedStyle(el.querySelector('.about-pol')!).rotate,
      };
    });
    expect(open).toEqual({
      folderStyle: '',
      bodyStyle: '',
      bodyClipped: false,
      contentStyle: '',
      popStyle: '',
      polaroidRotate: '-3deg',
    });

    await putAboutAt(page, 70);
    await idle(page);
    expect(await openIds(page)).toEqual([]);
    const closed = await page.locator('#about').evaluate((el) => {
      const body = el.querySelector<HTMLElement>('.folder-body')!;
      const content = el.querySelector<HTMLElement>('.folder-content')!;
      return el.style.marginLeft + el.style.marginRight + body.style.height + content.style.opacity + content.style.visibility;
    });
    expect(closed).toBe('');
  });

  test('tab click opens folder and all above', async ({ page }) => {
    await page.goto('/');
    const last = shownFolders().at(-1)!;
    await page.locator(`#${last} .folder-tab`).click();
    await idle(page);
    expect(await openIds(page)).toEqual(shownFolders());
    const top = await viewTop(page, last);
    expect(top).toBeGreaterThanOrEqual(-5);
    expect(top).toBeLessThanOrEqual(80);
  });

  test('End opens all, Home closes all', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await expect.poll(() => openIds(page)).toEqual(shownFolders());
    await idle(page);
    // It lands at the real end of the page, and everything stays open there.
    expect(
      await page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1),
    ).toBe(true);
    expect(await openIds(page)).toEqual(shownFolders());

    await page.keyboard.press('Home');
    await expect.poll(() => openIds(page), { timeout: 10_000 }).toEqual([]);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  // Both ways round: whichever language is longer, the folder must end up tall enough for it.
  for (const [from, to] of [
    ['en', 'id'],
    ['id', 'en'],
  ] as const) {
    test(`language switch mid-animation leaves no clipped folder (${from} to ${to})`, async ({ page }) => {
      await page.addInitScript((lang) => localStorage.setItem('lang', lang), from);
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', from);
      await putAboutAt(page, -10);
      // The switch has to land while About is still opening.
      await expect(page.locator('html')).toHaveAttribute('data-folders-busy', '1');
      await page.getByRole('button', { name: to.toUpperCase(), exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', to);
      await idle(page);
      const clipped = await page
        .locator('.folder[data-open] .folder-body')
        .evaluateAll((bodies) => bodies.map((body) => body.scrollHeight - body.clientHeight));
      expect(clipped.length).toBeGreaterThan(0);
      for (const px of clipped) expect(px).toBeLessThanOrEqual(1);
    });
  }

  test('resize keeps the stack closed at the top', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await idle(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await idle(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await openIds(page)).toEqual([]);
    await scrollTo(page, 200);
    await idle(page);
    expect(await openIds(page)).toEqual(['about']);
  });

  test('reduced motion shows everything open', async ({ page }) => {
    await gotoStatic(page);
    await expect(page.locator('html')).not.toHaveClass(/(^|\s)has-motion(\s|$)/);
    const contents = page.locator('.folder-content');
    await expect(contents).toHaveCount(shownFolders().length);
    for (const content of await contents.all()) {
      await expect(content).toBeVisible();
      await expect(content).toHaveCSS('opacity', '1');
    }
    // Scrolling does nothing: the motion code never started.
    await scrollTo(page, 600);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('html')).not.toHaveAttribute('data-folders-line', /.*/);
    await expect(page.locator('html')).not.toHaveAttribute('data-folders-busy', /.*/);
  });
});

test.describe('folder tabs as disclosure buttons', () => {
  test('aria-expanded follows the open state', async ({ page }) => {
    await page.goto('/');
    await idle(page);
    for (const id of shownFolders()) {
      const tab = page.locator(`#${id} .folder-tab`);
      await expect(tab, id).toHaveAttribute('aria-expanded', 'false');
      const controls = await tab.getAttribute('aria-controls');
      expect(controls, `${id} aria-controls`).toBeTruthy();
      // It names this folder's own body.
      expect(await page.locator(`#${controls}`).evaluate((el, folderId) => el.matches(`#${folderId} > .folder-body`), id)).toBe(true);
    }

    await putAboutAt(page, -10);
    await idle(page);
    await expect(page.locator('#about .folder-tab')).toHaveAttribute('aria-expanded', 'true');
    for (const id of shownFolders().slice(1)) await expect(page.locator(`#${id} .folder-tab`), id).toHaveAttribute('aria-expanded', 'false');

    await scrollTo(page, 0);
    await idle(page);
    await expect(page.locator('#about .folder-tab')).toHaveAttribute('aria-expanded', 'false');

    // The third folder's tab opens it and the two above; any folder below stays closed.
    const ids = shownFolders();
    await page.locator(`#${ids[2]} .folder-tab`).click();
    await idle(page);
    const expanded = await page.locator('.folder-tab').evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('aria-expanded')));
    expect(expanded).toEqual(ids.map((_, index) => String(index <= 2)));
  });

  test('every tab is expanded under reduced motion', async ({ page }) => {
    await gotoStatic(page);
    for (const id of shownFolders()) {
      await expect(page.locator(`#${id} .folder-tab`), id).toHaveAttribute('aria-expanded', 'true');
    }
  });
});

// All four closed tabs must be on the first screen (the cover reserves room for the closed stack),
// in the short windows too.
for (const viewport of FIRST_SCREENS) {
  test.describe(`closed stack at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('every closed tab is fully inside the viewport', async ({ page }) => {
      await page.goto('/');
      await idle(page);
      expect(await openIds(page)).toEqual([]);
      for (const id of shownFolders()) {
        const box = await page.locator(`#${id} .folder-tab`).boundingBox();
        if (!box) throw new Error(`${id} tab has no box`);
        expect(box.y, `${id} tab top`).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height, `${id} tab bottom`).toBeLessThanOrEqual(viewport.height);
        expect(box.x, `${id} tab left`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${id} tab right`).toBeLessThanOrEqual(viewport.width);
      }
    });
  });
}
