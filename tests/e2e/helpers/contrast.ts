import type { Page } from '@playwright/test';

export interface ContrastResult {
  selector: string;
  /** Text colour, as the computed `rgb(...)` string. */
  color: string;
  fontPx: number;
  /** WCAG "large text": at least 24px, or 18.66px and bold. It only needs 3:1 instead of 4.5:1. */
  large: boolean;
  /** Worst (lowest) contrast ratio over every rendered pixel behind the element's text. */
  ratio: number;
  /** The background pixel that produced `ratio`. */
  worstBackground: string;
}

/**
 * Measures the WCAG contrast of the text matched by each selector against what is really rendered
 * behind it, gradients, overlays and translucent pills included (axe cannot resolve those).
 *
 * It takes the first rendered element per selector and finds the box of each text node. It then
 * screenshots the viewport twice, with the text and with all text transparent. A pixel inside a box
 * that differs between the two is ink, and the result is the lowest ratio of the text colour against
 * the text-free background at any ink pixel. Text that leaves no ink at all counts as 1:1. Elements
 * must be in the first viewport of an unscrolled page.
 */
export async function measureContrast(page: Page, selectors: string[]): Promise<ContrastResult[]> {
  await page.evaluate(() => document.fonts.ready);
  // A cover photo still loading would read as a different background in each screenshot.
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
        })
        .map((img) => img.decode().catch(() => undefined)),
    ),
  );

  const targets = await page.evaluate((sels) => {
    return sels.map((selector) => {
      const element = [...document.querySelectorAll<HTMLElement>(selector)].find(
        (el) => el.getClientRects().length > 0,
      );
      if (!element) throw new Error(`no rendered element matches ${selector}`);

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const texts: { color: string; fontPx: number; large: boolean; rects: number[][] }[] = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()]
          .filter((r) => r.width > 1 && r.height > 1)
          .map((r) => [r.left, r.top, r.right, r.bottom]);
        if (rects.length === 0) continue;
        const style = getComputedStyle(node.parentElement!);
        const fontPx = parseFloat(style.fontSize);
        const bold = Number(style.fontWeight) >= 700;
        texts.push({ color: style.color, fontPx, large: fontPx >= 24 || (fontPx >= 18.66 && bold), rects });
      }
      if (texts.length === 0) throw new Error(`${selector} has no rendered text`);
      return { selector, texts };
    });
  }, selectors);

  const withText = (await page.screenshot()).toString('base64');
  const hider = await page.addStyleTag({
    content: '*, *::before, *::after { color: transparent !important; text-shadow: none !important; }',
  });
  const withoutText = (await page.screenshot()).toString('base64');
  await hider.evaluate((el) => (el as Element).remove());

  return page.evaluate(
    async ({ withText, withoutText, targets }) => {
      const pixels = async (image: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${image}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return { ctx, width: img.width, height: img.height };
      };
      const [textShot, plainShot] = [await pixels(withText), await pixels(withoutText)];
      const scale = plainShot.width / window.innerWidth;

      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (r: number, g: number, b: number) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

      return targets.map(({ selector, texts }) => {
        let worst = { margin: Infinity, ratio: Infinity, color: '', fontPx: 0, large: false, background: '' };
        for (const text of texts) {
          const [tr, tg, tb] = text.color.match(/[\d.]+/g)!.map(Number);
          const textLum = luminance(tr, tg, tb);
          for (const [left, top, right, bottom] of text.rects) {
            const x0 = Math.max(0, Math.floor(left * scale));
            const y0 = Math.max(0, Math.floor(top * scale));
            const x1 = Math.min(plainShot.width, Math.ceil(right * scale));
            const y1 = Math.min(plainShot.height, Math.ceil(bottom * scale));
            if (x1 <= x0 || y1 <= y0) throw new Error(`${selector} is outside the screenshot`);
            const plain = plainShot.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
            const lit = textShot.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
            let ink = 0;
            for (let i = 0; i < plain.length; i += 4) {
              if (plain[i] === lit[i] && plain[i + 1] === lit[i + 1] && plain[i + 2] === lit[i + 2]) continue;
              ink += 1;
              const bgLum = luminance(plain[i], plain[i + 1], plain[i + 2]);
              const [hi, lo] = textLum > bgLum ? [textLum, bgLum] : [bgLum, textLum];
              const ratio = (hi + 0.05) / (lo + 0.05);
              // Compared against the threshold that applies to this text, so large and small text mix fairly.
              const margin = ratio / (text.large ? 3 : 4.5);
              if (margin < worst.margin) {
                worst = {
                  margin,
                  ratio,
                  color: text.color,
                  fontPx: text.fontPx,
                  large: text.large,
                  background: `rgb(${plain[i]}, ${plain[i + 1]}, ${plain[i + 2]})`,
                };
              }
            }
            if (ink === 0) {
              worst = { margin: 0, ratio: 1, color: text.color, fontPx: text.fontPx, large: text.large, background: 'no ink' };
            }
          }
        }
        return {
          selector,
          color: worst.color,
          fontPx: worst.fontPx,
          large: worst.large,
          ratio: worst.ratio,
          worstBackground: worst.background,
        };
      });
    },
    { withText, withoutText, targets },
  );
}
