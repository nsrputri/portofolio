// Makes public/og.png, the preview image that WhatsApp, LinkedIn and others show when the site is
// shared: a 1200x630 screenshot of the cover with the closed folder stack, taken with Playwright's
// Chromium. The page is laid out 1500x788 and shot at twice the pixels, then scaled down to exactly
// 1200x630: that leaves room for all four folder tabs (a 1200x630 window is too short for the last
// one) and keeps the text crisp.
//
// WhatsApp drops a preview image of about 300 KB or more, so the PNG is saved as a palette image
// (256 colours or fewer) at maximum compression, and the script stops if it still comes out too big.
//
// Needs the built site running first (in another terminal):  npm run build  then  npm run preview
// Then run:  npm run og
// Run it again after changing the cover (tagline, photo, colours), then commit public/og.png.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const WIDTH = 1200;
const HEIGHT = 630;
/** The page is laid out this much wider than the picture. */
const ZOOM_OUT = 0.8;
const output = fileURLToPath(new URL('../public/og.png', import.meta.url));
/** WhatsApp drops og:images of about 300 KB or more; stay clearly under. */
const MAX_BYTES = 280 * 1000;
/** Palette settings to try in turn, from best looking to smallest, until the file fits. */
const ENCODINGS = [
  { colours: 256, quality: 90 },
  { colours: 192, quality: 80 },
  { colours: 128, quality: 70 },
  { colours: 64, quality: 60 },
];

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
  const scaled = sharp(shot).resize(WIDTH, HEIGHT);
  let written = null;
  for (const { colours, quality } of ENCODINGS) {
    const png = await scaled.clone().png({ palette: true, colours, quality, effort: 10, compressionLevel: 9 }).toBuffer();
    if (png.length <= MAX_BYTES) {
      written = { png, colours };
      break;
    }
  }
  if (!written) {
    throw new Error(
      `public/og.png would still be over ${MAX_BYTES / 1000} KB with 64 colours, which WhatsApp would drop. ` +
        'Use a smaller or simpler cover photo and run this again.',
    );
  }
  await writeFile(output, written.png);
  console.log(`Wrote ${output} (${(written.png.length / 1000).toFixed(0)} KB, ${written.colours} colours)`);
} finally {
  await browser.close();
}
