// Runs Lighthouse (mobile, Performance only) against the built site and fails when the score is
// below 90, the bar this site has to clear. It uses Playwright's Chromium, so no separate Chrome is needed.
//
// Needs the built site running first (in another terminal):  npm run build  then  npm run preview
// Then run:  npm run lighthouse
// The full report is written to lighthouse/report.html (git-ignored): open it in a browser.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const url = process.argv[2] ?? 'http://127.0.0.1:4321/';
const MIN_SCORE = 90;
const reportPath = fileURLToPath(new URL('../lighthouse/report.html', import.meta.url));

// Say so plainly when the site is not running, instead of leaving Lighthouse to fail obscurely.
try {
  await fetch(url);
} catch (error) {
  throw new Error(
    `Could not open ${url}. Is the site running? Run "npm run build" and then "npm run preview" in another terminal.\n${error.message}`,
  );
}

/**
 * Starts Chrome with Playwright's Chromium. If that cannot start (on some Windows setups its full
 * chrome.exe fails with "side-by-side configuration is incorrect" even though Playwright's own
 * headless shell runs fine), it falls back to the Chrome installed on the computer, which
 * chrome-launcher finds by itself (CHROME_PATH overrides the search).
 */
async function startChrome() {
  const chromeFlags = ['--headless=new'];
  try {
    return await launch({ chromePath: chromium.executablePath(), chromeFlags });
  } catch (error) {
    console.log(`Playwright's Chromium would not start (${error.code ?? error.message}); trying the installed Chrome.`);
    return launch({ chromeFlags });
  }
}

const chrome = await startChrome();
try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'html',
    logLevel: 'error',
    onlyCategories: ['performance'],
    // Mobile is also Lighthouse's default: a phone-sized screen, slow 4G and a 4x slower CPU.
    formFactor: 'mobile',
  });
  if (!result) throw new Error('Lighthouse returned no result.');

  await mkdir(fileURLToPath(new URL('../lighthouse/', import.meta.url)), { recursive: true });
  await writeFile(reportPath, String(result.report));

  const { lhr } = result;
  const score = Math.round((lhr.categories.performance.score ?? 0) * 100);
  console.log(`Lighthouse mobile performance: ${score} (needs ${MIN_SCORE})`);
  for (const id of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
  ]) {
    console.log(`  ${lhr.audits[id].title}: ${lhr.audits[id].displayValue}`);
  }

  // What to look at when the score is low: the metrics that lost points, then Lighthouse's insights
  // (render-blocking CSS, font chains and so on) that it found something to say about.
  const weights = new Map(lhr.categories.performance.auditRefs.map((ref) => [ref.id, ref.weight]));
  const worth = Object.values(lhr.audits)
    .filter((audit) => audit.score !== null && audit.score < 0.9 && ((weights.get(audit.id) ?? 0) > 0 || audit.id.endsWith('-insight')))
    .sort((a, b) => (weights.get(b.id) ?? 0) - (weights.get(a.id) ?? 0));
  for (const audit of worth) console.log(`  Look at: ${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}`);
  console.log(`Report: ${reportPath}`);

  if (score < MIN_SCORE) process.exitCode = 1;
} finally {
  chrome.kill();
}
