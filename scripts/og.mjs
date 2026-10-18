// Makes public/og.png, the preview image that WhatsApp, LinkedIn and others show when the site is
// shared: a 1200x630 screenshot of the cover with the closed folder stack, taken with Playwright's
// Chromium. The page is laid out 1500x788 and shot at twice the pixels, then scaled down to exactly
// 1200x630: that leaves room for all four folder tabs (a 1200x630 window is too short for the last
// one) and keeps the text crisp.
//
// Needs the built site running first (in another terminal):  npm run build  then  npm run preview
// Then run:  npm run og
// Run it again after changing the cover (tagline, photo, colours), then commit public/og.png.
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const WIDTH = 1200;
const HEIGHT = 630;
/** The page is laid out this much wider than the picture. */
const ZOOM_OUT = 0.8;
const output = fileURLToPath(new URL('../public/og.png', import.meta.url));

const browser = await chromium.launch();
try {
  // Motion stays on (the default), so the folders sit closed in the stack, as a first-time visitor sees them.
  const page = await browser.newPage({
    viewport: { width: WIDTH / ZOOM_OUT, height: Math.round(HEIGHT / ZOOM_OUT) },
    deviceScaleFactor: ZOOM_OUT * 2,
  });

  try {
    await page.goto(url, { waitUntil: 'load' });
  } catch (error) {
    throw new Error(
      `Could not open ${url}. Is the site running? Run "npm run build" and then "npm run preview" in another terminal.\n${error.message}`,
    );
  }

  // The language toggle floats over the page, and a share picture has no use for it.
  await page.addStyleTag({ content: '.lang-toggle { display: none !important; }' });

  // The screenshot must show the closed stack, so wait until folders.ts has measured and settled.
  await page.waitForSelector('html.has-motion[data-folders-line]:not([data-folders-busy])', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  // Only images in the first screen matter; lazy ones further down would never finish loading.
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((img) => img.getBoundingClientRect().top < window.innerHeight)
        .map((img) => img.decode().catch(() => {})),
    ),
  );
  // One more frame so the last of the fonts and images has been painted.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  const shot = await page.screenshot();
  await sharp(shot).resize(WIDTH, HEIGHT).png().toFile(output);
  console.log(`Wrote ${output}`);
} finally {
  await browser.close();
}
