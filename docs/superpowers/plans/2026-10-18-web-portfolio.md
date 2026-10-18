# Web Portfolio "Folder Pastel" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-page, bilingual (EN default, ID toggle) internship portfolio in Astro where four pastel folders sit stacked on a collage cover and open one by one as you scroll down (and close again as you scroll up), filled with dummy content that is ready to be swapped for real content.

**Architecture:** Static Astro site, no UI framework. All content lives in one typed data file validated by a zod schema at build time. Both languages are rendered into the HTML, and CSS shows the active one, switched by `<html lang>`. Three small client scripts (language, folders, lightbox) put their decisions in pure functions so they can be unit-tested, and Playwright tests the built page.

**Tech Stack:** Astro (latest stable, TypeScript strict), GSAP, Fontsource (self-hosted fonts), Vitest + happy-dom (unit), Playwright + @axe-core/playwright (e2e/a11y), sharp (placeholder assets), Lighthouse.

**Spec:** `docs/superpowers/specs/2026-10-18-web-portfolio-design.md`

**Visual/motion reference:** `.superpowers/brainstorm/mockups/opsi-b.html`, `shared.css`, `shared.js` (approved mockup; port markup, CSS and motion code from these). Serve with `python .superpowers/brainstorm/serve.py` → `http://localhost:5180/opsi-b.html`.

## Global Constraints

- Astro latest stable, `output: 'static'`, TypeScript strict. No React or any UI framework. Animation with GSAP only.
- Node.js LTS. It is not installed yet. Installing it (`winget install OpenJS.NodeJS.LTS` or the official installer) needs the owner's approval first.
- Every user-visible string in data is `{ en: string; id: string }`. All content lives in `src/data/content.ts` and is validated by `src/data/schema.ts` when the build runs.
- Default language is `en`. The toggle reads `EN | ID`. There is no browser-language auto-detect. The choice is stored in `localStorage` key `lang`.
- Folders, in order: 01 About Me, pink `#e8c8c2`, tab left · 02 Study Journey, cream `#dad3c3`, tab right · 03 What I Do, blue-grey `#bccad5`, tab left · 04 Certificates, butter `#f1e6b9`, tab right. The certificate board is `#2f6fe0` and its clips are `#ee5ea9`.
- Motion: open line = `max(0.2·vh, min(0.42·vh, aboutTop − 80px))`, where `aboutTop` is About's document top. A folder opens when its top goes above the line. The last open folder closes when its top goes below `line + 48px`. Folders open in order and close in reverse, one animation at a time. Closed folders are inset `3.5vw` on each side. No scroll pinning.
- `prefers-reduced-motion: reduce`: all folders are open, with no animation and no open/close.
- Fonts are self-hosted via Fontsource: Instrument Serif, DM Mono, Caveat, DM Sans, Silkscreen. No runtime requests to `fonts.googleapis.com` or `fonts.gstatic.com`.
- The layout works from 360px wide, with no horizontal scroll, in both languages. Light mode only.
- Lighthouse mobile Performance must be at least 90.
- `.superpowers/` and `.claude/` are git-ignored.
- Never deploy while content is dummy (Task 10 is gated on real content).
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Long Indonesian strings at 360px** (tab labels, card titles, timeline text): text should wrap, and nothing should overflow or cause horizontal scroll. Covered by the Task 9 test `no horizontal scroll at 360px in en and id`.
2. **Switching language while a folder is opening or open:** the open folder should re-fit its new text with nothing clipped. Covered by the Task 7 test `language switch mid-animation leaves no clipped folder`.
3. **Resizing or rotating the viewport:** the line should be recomputed, closed heights should follow `--V`, and the stack should stay closed at the top. Covered by the Task 7 test `resize keeps the stack closed at the top`.
4. **Jumping (End/Home keys, tab clicks):** folders should catch up in order and end in a consistent state. Covered by the Task 7 tests `End opens all, Home closes all` and `tab click opens folder and all above`.
5. **Optional data absent** (no cover photo, no Instagram): the page should still render, using the gradient fallback and leaving out that link. Covered by Task 4 `cover falls back to gradient without a cover photo` and Task 8 `optional links render only when set`. The dummy data deliberately leaves out `coverPhoto` and `instagram`.

---

### Task 1: Project scaffold, tooling, tokens and fonts

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`
- Modify: `.claude/launch.json` (local only, add an `astro` dev config)
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `Base.astro` with props `{ title: Localized; description: Localized }` (until Task 2 exists, plain strings are fine; switch to `Localized` in Task 3). It renders `<html lang="en">`, imports the fonts and both CSS files, and has a default slot.
- Produces: CSS custom properties in `tokens.css`, ported from the mockup `shared.css` `:root`: `--bg --paper --ink --muted --pink --beige --blue --butter --board --clip --red --serif --mono --hand --sans --tab-h:54px --gutter`.
- Produces: npm scripts `dev`, `build` (`astro check && astro build`), `preview`, `test` (`vitest run`), `test:e2e` (`playwright test`).

- [ ] **Step 1: Check Node.** Run `node -v`. Expected: an LTS version (v22 or later). If it is missing, stop and ask the owner to approve `winget install OpenJS.NodeJS.LTS`, then open a new shell.
- [ ] **Step 2: Init repo and deps.** `git init`. Write `.gitignore` with `node_modules/ dist/ .astro/ .superpowers/ .claude/ test-results/ playwright-report/ lighthouse/`. Run `npm init -y`, then `npm i astro gsap @fontsource/instrument-serif @fontsource/dm-mono @fontsource/caveat @fontsource-variable/dm-sans @fontsource/silkscreen`, then `npm i -D typescript @astrojs/check vitest happy-dom @playwright/test @axe-core/playwright sharp lighthouse chrome-launcher`, then `npx playwright install chromium`.
- [ ] **Step 3: Config.** In `astro.config.mjs`, set `site: 'https://namakamu.pages.dev'` and `output: 'static'`. `tsconfig.json` extends `astro/tsconfigs/strict`. `vitest.config.ts` uses `getViteConfig` from `astro/config`, with `test.include: ['tests/unit/**/*.test.ts']`. `playwright.config.ts` sets `testDir: 'tests/e2e'`, `webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321', url: 'http://127.0.0.1:4321', timeout: 180_000 }`, `use.baseURL` to the same URL, and one project `desktop` (1280×800). Tests that need other sizes set the viewport themselves.
- [ ] **Step 4: Write the failing smoke test** `tests/e2e/smoke.spec.ts`:

```ts
test('home page loads with English default and self-hosted fonts', async ({ page }) => {
  const fontHosts: string[] = [];
  page.on('request', (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url()); });
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('DM Sans');
  expect(fontHosts).toEqual([]);
});
```

- [ ] **Step 5: Run** `npx playwright test smoke`. Expected: FAIL, because there is no page yet or the build fails.
- [ ] **Step 6: Implement.** Write `tokens.css`, `global.css` (reset, body background/font, `overflow-x: clip`), `Base.astro` (imports the fonts and CSS, sets `lang="en"`, viewport meta and title), and a minimal `index.astro`. Add the `astro` config (`npm run dev`, port 4321) to `.claude/launch.json`.
- [ ] **Step 7: Run** `npx playwright test smoke`. Expected: PASS.
- [ ] **Step 8: Commit.** `git add -A` (docs/ included), then `git commit -m "chore: scaffold Astro project with fonts, tokens and test tooling"`.

---

### Task 2: Content schema, rich-text helper, dummy content and placeholder assets

**Files:**
- Create: `src/data/schema.ts`, `src/data/content.ts`, `src/lib/rich.ts`, `scripts/make-placeholders.mjs`
- Create (generated, committed): `src/assets/placeholders/*.jpg`, `public/cv/cv-en.pdf`, `public/cv/cv-id.pdf`
- Test: `tests/unit/schema.test.ts`, `tests/unit/rich.test.ts`

**Interfaces:**
- Produces in `schema.ts`, using `z` from `astro/zod`. If the bundled zod is v4, use `z.email()` and `z.url()` in place of `.email()` and `.url()`.
  - `localized`: `z.object({ en: z.string().trim().min(1), id: z.string().trim().min(1) })` → `type Localized`
  - `image`: `z.custom<ImageMetadata>`, which checks for an object with `src`, `width`, `height`. Message: `expected an imported image`.
  - `siteSchema` with these keys (all `Localized` unless noted):
    - `site`: `name: string` (barcode name), `title`, `description`, `cornerLeft`, `cornerRight`, `tagline`, `note`, `status`, `thanks`, `portrait: image`, `portraitAlt`, `coverPhoto?: image`, `cv: { en, id }` (strings matching `^/cv/[\w.-]+\.pdf$`), `links: { email (email), linkedin (url), github (url), whatsapp? (digits 8–15), instagram? (url) }`
    - `ui`: `folders: { about, study, work, cert }`, `downloadCv`, `close`, `language` (aria label), `viewCredential`, `categories: { practicum, project, organization, competition }`
    - `about`: `kicker`, `heading`, `intro`, `photo: image`, `photoAlt`, `caption`, `facts: { label, value }[] (min 1)`, `skills: string[] (min 1)`, `song: string`
    - `study`: `kicker`, `heading`, `items: { when, title, text, current: boolean (default false) }[] (min 1)`
    - `work`: `kicker`, `heading`, `items: { category: 'practicum'|'project'|'organization'|'competition', title, meta, details, photo: image, photoAlt, gallery: { image, alt }[] (default []) }[] (min 1)`
    - `certificates`: `items: { title: string, issuer: string, year: int 2000–2100, image, alt, credentialUrl?: url, pdf?: string matching ^/certificates/[\w.-]+\.pdf$ }[] (min 1)`
  - `type SiteContent = z.infer<typeof siteSchema>`
  - `parseContent(raw: unknown): SiteContent`. On failure it throws `Error` whose message starts with `Invalid content:` and lists each issue as `- <dot.path>: <message>` on its own line.
- Produces in `content.ts`: `export const content: SiteContent = parseContent({...})`. The images are imported from `src/assets/placeholders/`.
- Produces in `rich.ts`: `renderEm(text: string): string`. It HTML-escapes `& < > " '`, then turns `*x*` into `<em>x</em>` and `\n` into `<br>`.

- [ ] **Step 1: Write failing tests.**
  - `rich.test.ts`: `renderEm('stay *curious*,\nstay')` → `'stay <em>curious</em>,<br>stay'`. `renderEm('<b>&</b>')` → `'&lt;b&gt;&amp;&lt;/b&gt;'`. `renderEm('a * b')` → unchanged `'a * b'`.
  - `schema.test.ts`: build a `valid()` fixture (minimal valid object, with images faked as `{ src: '/x.jpg', width: 1, height: 1, format: 'jpg' }`).
    - `parseContent(valid())` does not throw. `content` from `content.ts` parses, has 4 work items and 4 certificates, has no `coverPhoto` and no `links.instagram`.
    - Missing `about.intro.id` throws, and the message contains `about.intro.id`.
    - An empty `site.status.en` (`'  '`) throws.
    - `links.email = 'nope'` throws, and the message contains `site.links.email`.
    - `cv.en = '/files/cv.docx'` throws.
    - `whatsapp` absent passes. `whatsapp = '+62 812'` throws.
    - `work.items[0].category = 'hobby'` throws.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL (modules missing).
- [ ] **Step 3: Generate assets.** Write `scripts/make-placeholders.mjs`, which uses sharp to render labelled SVGs to JPG in `src/assets/placeholders/`: `portrait.jpg` 800×1000 "FOTO KAMU", `work-1..4.jpg` 1200×900 "FOTO KEGIATAN n", `work-1-extra-1..2.jpg`, and `cert-1..4.jpg` 1400×1000 "SCAN SERTIFIKAT n" on a paper-coloured background. It also writes two minimal valid one-page PDFs to `public/cv/cv-en.pdf` and `public/cv/cv-id.pdf`. Add the npm script `placeholders` and run it.
- [ ] **Step 4: Implement `schema.ts`, `rich.ts` and `content.ts`.** Base the dummy content on the mockup `shared.js` texts (TRI UGM, Mikrotik, FTTH, IoT, MTCNA, CCNA ITN and so on), with `id` as written there and `en` translated. `site.name = 'NAMA KAMU'`. The tagline is `{ en: 'stay *curious*,\nstay *connected*', id: 'tetap *penasaran*,\ntetap *terhubung*' }`. Folder labels are `en: About Me / Study Journey / What I Do / Certificates` and `id: Tentang Aku / Perjalanan Kuliah / Yang Aku Lakukan / Sertifikat`. The last study item has `current: true`. Include `links.whatsapp`, and leave out `coverPhoto` and `instagram`.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: add validated content schema, dummy content and placeholder assets`.

---

### Task 3: Bilingual text and language toggle

**Files:**
- Create: `src/scripts/lang.ts`, `src/components/T.astro`, `src/components/BiImage.astro`, `src/components/LangToggle.astro`
- Modify: `src/layouts/Base.astro` (inline head script, localized title/description, data attributes), `src/styles/global.css` (visibility rules), `src/pages/index.astro`
- Test: `tests/unit/lang.test.ts` (`// @vitest-environment happy-dom`), `tests/e2e/lang.spec.ts`

**Interfaces:**
- Consumes: `Localized`, `content`, `renderEm`.
- Produces in `lang.ts`:
  - `type Lang = 'en' | 'id'`
  - `LANG_KEY = 'lang'`
  - `resolveLang(stored: string | null): Lang`: `'id'` returns `'id'`, anything else returns `'en'`.
  - `readStoredLang(storage: Pick<Storage, 'getItem'> | null): Lang`: never throws.
  - `applyLang(doc: Document, lang: Lang): void`:
    - sets `documentElement.lang`;
    - sets each `img[data-alt-en]`'s `alt` from `data-alt-<lang>`;
    - sets `doc.title` from `<html data-title-en/-id>`, and `meta[name="description"]` content from `<html data-desc-en/-id>`;
    - sets `aria-pressed` on `[data-set-lang]` buttons;
    - dispatches `new CustomEvent('langchange', { detail: { lang } })` on `doc.defaultView`.
  - `initLangToggle(doc: Document, storage: Storage | null): void`: clicking `[data-set-lang]` runs `applyLang` and stores the choice. Storage errors are ignored.
  - `safeLocalStorage(): Storage | null`: returns `window.localStorage`, or `null` if accessing it throws (private mode, blocked site data).
- Produces components:
  - `<T text={Localized} rich?={boolean} />` renders `<span lang="en" data-l="en">…</span><span lang="id" data-l="id">…</span>`. With `rich`, it uses `set:html={renderEm(...)}`.
  - `<BiImage src={ImageMetadata} alt={Localized} …imageProps />` wraps `astro:assets` `<Image>`, with `alt={alt.en}`, `data-alt-en` and `data-alt-id`.
  - `<LangToggle label={Localized} />` is fixed at `top: 12px; right: 12px` and contains two buttons `data-set-lang="en"` / `"id"`.
- CSS rule: `html:not([lang="id"]) [data-l="id"], html[lang="id"] [data-l="en"] { display: none !important; }`.
- Inline head script (`is:inline`): reads `localStorage.lang` in try/catch and sets `document.documentElement.lang` before first paint. It duplicates `resolveLang` because inline scripts cannot import.

- [ ] **Step 1: Write failing unit tests.**
  - `resolveLang(null)` → `'en'`. `resolveLang('id')` → `'id'`. `resolveLang('fr')` → `'en'`.
  - `readStoredLang({ getItem: () => { throw new Error('denied') } })` → `'en'`.
  - `applyLang` on a document with `<html data-title-en="A" data-title-id="B">`, `<img data-alt-en="x" data-alt-id="y">` and two `[data-set-lang]` buttons, with `'id'`: `lang === 'id'`, `title === 'B'`, `img.alt === 'y'`, the `id` button has `aria-pressed="true"` and the `en` button `"false"`. A `langchange` listener receives `detail.lang === 'id'`.
- [ ] **Step 2: Write failing e2e** `lang.spec.ts`:
  - `default is English`: `page.getByText('Download CV')` is visible and `Unduh CV` is hidden. (Add one `<T>` with `ui.downloadCv` to `index.astro` for this test. Task 4 moves it into the cover.)
  - `toggle switches to Indonesian without reload`: record `performance.timeOrigin`, click `ID`. `html[lang=id]`, `Unduh CV` visible, same `timeOrigin`.
  - `choice persists after reload`: click `ID`, reload, `html[lang=id]`.
  - `scroll position kept on toggle`: scroll to 600, click `ID`, `|scrollY − 600| ≤ 2`.
- [ ] **Step 3: Run** `npm test` and `npx playwright test lang`. Expected: FAIL.
- [ ] **Step 4: Implement** `lang.ts`, the components, the Base changes (title/description from `content.site`, `<meta name="description">` updated by `applyLang` from `data-desc-en/-id`) and the CSS rule. Wire `initLangToggle(document, safeLocalStorage())` from a `<script>` in `LangToggle.astro`.
- [ ] **Step 5: Run both.** Expected: PASS.
- [ ] **Step 6: Commit** `feat: add EN/ID language toggle with persisted choice`.

---

### Task 4: Cover and page meta

**Files:**
- Create: `src/components/Cover.astro`, `src/components/decor/Flower.astro`, `src/components/decor/Paperclip.astro`, `src/components/decor/Sticker.astro` (barcode name sticker), `src/components/Polaroid.astro`
- Modify: `src/layouts/Base.astro` (Open Graph and canonical meta), `src/pages/index.astro`, `src/styles/global.css`
- Test: `tests/e2e/cover.spec.ts`

**Interfaces:**
- Consumes: `content.site`, `content.ui`, `T`, `BiImage`.
- Produces: `<Cover site={SiteContent['site']} ui={SiteContent['ui']} />`. It renders `header.cover` and reserves `padding-bottom: var(--stack-h)` for the folder stack (Task 5 defines `--stack-h`). Selectors the tests rely on: `.cover-corner--left`, `.cover-corner--right`, `.cover .sticker`, `.cover .status`, and two CV links, `a.cv-link[data-l="en"][href=site.cv.en][download]` and `a.cv-link[data-l="id"][href=site.cv.id][download]`.
- Produces: `<Polaroid>` (props `{ src, alt: Localized, caption?: Localized, pin?: boolean, tape?: boolean, class? }`) and `<Sticker name={string} sub={string} size?='sm'|'lg'>`. Both are reused in Tasks 5 and 8.
- Produces: Base meta `og:title`, `og:description` (en), `og:image` = `new URL('/og.png', Astro.site)`, `og:url`, `twitter:card=summary_large_image`, `<link rel="canonical">`.
- Port the cover markup and CSS from the mockup (`heroHTML` in `shared.js`, `.hero*`, `.note`, `.sticker`, `.barcode`, `.btn`, `.status`, `.fl` in `shared.css`). The corner row gets enough right padding that the fixed language toggle never overlaps `cornerRight`. With no `coverPhoto`, `.cover` gets class `cover--fallback` and uses the mockup gradient. With a photo, it renders `BiImage` with `loading="eager"` plus a dark overlay for white-text contrast.

- [ ] **Step 1: Write failing e2e** `cover.spec.ts`:
  - `key info visible in the first viewport` at 1280×800 and at 360×780: the name sticker, `Download CV` link and status text each have a bounding box inside `[0, viewport.height]`.
  - `CV link follows language`: the visible `.cv-link` has `href` `/cv/cv-en.pdf`. After clicking `ID`, it has `/cv/cv-id.pdf`. A request to the visible href returns 200.
  - `cover falls back to gradient without a cover photo`: `.cover` has class `cover--fallback`.
  - `meta tags`: `meta[property="og:image"]` content ends with `/og.png`, `meta[name="description"]` is non-empty, and `link[rel=canonical]` exists.
  - `toggle does not overlap corner label`: the bounding boxes of `[data-set-lang]` group and `.cover-corner--right` do not intersect, at 1280 and at 360.
- [ ] **Step 2: Run** `npx playwright test cover`. Expected: FAIL.
- [ ] **Step 3: Implement** the cover, decor components and meta. Add `<Cover>` to `index.astro` in place of Task 3's temporary `<T>`.
- [ ] **Step 4: Run** `npx playwright test cover lang smoke`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add collage cover with CV download and page meta`.

---

### Task 5: Folder shell, About Me and Study Journey

**Files:**
- Create: `src/components/Folder.astro`, `src/components/folders/AboutMe.astro`, `src/components/folders/StudyJourney.astro`, `src/components/decor/Cassette.astro`
- Modify: `src/pages/index.astro`, `src/styles/global.css` (folder shell, stack vars)
- Test: `tests/e2e/helpers.ts`, `tests/e2e/folders-content.spec.ts`

**Interfaces:**
- Consumes: `content.about`, `content.study`, `content.ui.folders`, `Polaroid`, `T`, `BiImage`.
- Produces the DOM contract that Tasks 6–7 rely on:
  - `main.stack` contains, in order, `section.folder#about|#study|#work|#cert` with `data-index="0..3"`, `data-tab="left|right"` and `style="--c:var(--pink|--beige|--blue|--butter)"`.
  - Each folder holds `button.folder-tab` (number + `<T>` label), `div.folder-body`, `div.folder-content`. Items that should "drop in" have class `pop`.
- Produces `<Folder id no label={Localized} color tab>` with a default slot.
- Produces CSS vars on `.stack`, from mockup opsi-b: `--V: clamp(72px, 10.5vh, 108px)`, `--overlap: calc(var(--tab-h) + 20px)`, and `--stack-h: calc(4 * var(--V) + var(--overlap))` on `:root` so Cover can use it. Folders overlap with `margin-top: calc(-1 * var(--overlap))`. `.stack` uses `margin-top: calc(-1 * var(--stack-h))`. Open folders get bottom room `padding-bottom: calc(var(--overlap) + 48px)` on `.folder-content`.
- At this stage folders render **open** (static). Closing is added in Task 7 under `html.has-motion`.
- Produces in `tests/e2e/helpers.ts`: `gotoStatic(page)` (emulates `reducedMotion: 'reduce'`, then `goto('/')`) and `noHorizontalScroll(page): Promise<boolean>` (`scrollWidth <= clientWidth`).
- Port the folder shell CSS (`.folder*`, tab inverse corners, paper sheet `::after`) and the content CSS (`.about`, `.facts`, `.chips`, `.cassette`, `.timeline`) from the mockup `shared.css`.

- [ ] **Step 1: Write failing e2e** `folders-content.spec.ts` (use `gotoStatic`):
  - `four folders in order with localized tabs`: ids are `['about','study','work','cert']` and the tab texts are `About Me, Study Journey, What I Do, Certificates`. After clicking `ID`, they are `Tentang Aku, Perjalanan Kuliah, Yang Aku Lakukan, Sertifikat`.
  - `folder colours and tab sides`: `#about` computed background of `.folder-body` is `rgb(232, 200, 194)` and `data-tab` is `left`, `#study` is `rgb(218, 211, 195)` with `right`, `#work` is `rgb(188, 202, 213)` with `left`, `#cert` is `rgb(241, 230, 185)` with `right`.
  - `about shows facts and skills`: `#about .facts > div` count is `4` and `#about .chips li` count is `5`. These are the dummy counts from Task 2, so update the test if the dummy data changes.
  - `study marks the current item`: exactly one `.timeline li.now`, and it is the last item.
- [ ] **Step 2: Run** `npx playwright test folders-content`. Expected: FAIL.
- [ ] **Step 3: Implement** `Folder`, `AboutMe`, `StudyJourney` and `Cassette`, plus placeholder `Folder` shells for `work` and `cert` (labels only) so that the order test can pass.
- [ ] **Step 4: Run** `npx playwright test folders-content cover`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add folder shell with About Me and Study Journey`.

---

### Task 6: What I Do, Certificates and lightbox

**Files:**
- Create: `src/components/folders/WhatIDo.astro`, `src/components/folders/Certificates.astro`, `src/components/decor/BinderClip.astro`, `src/components/Lightbox.astro`, `src/scripts/lightbox.ts`
- Modify: `src/pages/index.astro`, `src/styles/global.css`
- Test: `tests/e2e/lightbox.spec.ts`, extend `tests/e2e/folders-content.spec.ts`

**Interfaces:**
- Consumes: `content.work`, `content.certificates`, `content.ui`, the Task 5 DOM contract, `Polaroid`, `BiImage`, `T`.
- Produces the lightbox contract:
  - Each card is a `<button class="w-card|c-card pop" data-lightbox="lb-work-<n>|lb-cert-<n>">`, paired with `<template id="lb-…">` that holds the detail content.
  - `Lightbox.astro` renders a single `<dialog id="lightbox">` containing `.lightbox-body` and `button.lightbox-close` (`<T text={ui.close}>`).
  - `initLightbox(doc: Document): void`:
    - clicking a `[data-lightbox]` copies its template's content into `.lightbox-body` and calls `showModal()`;
    - the close button and a backdrop click (`event.target === dialog`) call `close()`;
    - Esc uses the native dialog behaviour;
    - on close, the body is emptied.
  - CSS: `html:has(dialog[open]) { overflow: hidden; }`.
- Work detail template: title, category, meta, `details`, then the main photo and the gallery images (`BiImage`, lazy).
- Certificate detail template: the full scan (`BiImage`, `widths` up to 1600), title, issuer and year. It adds an `a[target=_blank][rel=noopener]` with `ui.viewCredential` when `credentialUrl` is set, and a PDF link when `pdf` is set.
- Certificate numbers are `String(i + 1).padStart(2, '0')`. Card tilt comes from a `--r` value cycling through `['-3deg','2deg','-1.5deg','3deg']`.
- Port `.work*`, `.w-card`, `.tag`, `.binder`, `.board*`, `.c-card`, `.clip` from the mockup `shared.css`. The board title is `CERTIFICATES >>>>` in Silkscreen in both languages.

- [ ] **Step 1: Write failing e2e.**
  - `folders-content.spec.ts`:
    - `what I do cards show localized category`: there are 4 `.w-card`, and the first `.tag` reads `Practicum` in en and `Praktikum` in id.
    - `certificates numbered 01–04`: the `.c-card .c-no` texts are `['01','02','03','04']`.
  - `lightbox.spec.ts` (with `gotoStatic`):
    - `certificate opens full scan`: click the first `.c-card`. `#lightbox` is open, and `.lightbox-body img` has `naturalWidth > 0`.
    - `Esc closes and returns focus`: press Escape, the dialog is closed, and `document.activeElement` is the first `.c-card`.
    - `keyboard opens a card`: focus the first `.w-card` and press Enter. The dialog is open and the body contains the localized `details` text.
    - `backdrop click closes`: click at (5, 5). The dialog is closed.
    - `page does not scroll while open`: open it, `mouse.wheel(0, 800)`, and `scrollY` is unchanged.
- [ ] **Step 2: Run** `npx playwright test folders-content lightbox`. Expected: FAIL.
- [ ] **Step 3: Implement** the components, `lightbox.ts` (wired from a `<script>` in `Lightbox.astro`) and the CSS.
- [ ] **Step 4: Run** `npx playwright test`. Expected: PASS (all specs so far).
- [ ] **Step 5: Commit** `feat: add What I Do and Certificates folders with lightbox details`.

---

### Task 7: Folder motion ("Mekar")

**Files:**
- Create: `src/scripts/folders.ts`
- Modify: `src/layouts/Base.astro` (the inline head script adds `has-motion`), `src/styles/global.css` (closed state), `src/pages/index.astro` (wire `initFolders`)
- Test: `tests/unit/folders.test.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/helpers.ts` (add `idle`, `openIds`)

**Interfaces:**
- Consumes: the Task 5 DOM contract, and the `langchange` event from Task 3.
- Produces in `folders.ts`:
  - `OPEN_RATIO = 0.42`, `MIN_RATIO = 0.2`, `REST_MARGIN = 80`, `GAP = 48`
  - `computeLine(aboutTop: number, viewportH: number): number` = `max(vh·MIN_RATIO, min(vh·OPEN_RATIO, aboutTop − REST_MARGIN))`
  - `interface FolderSnapshot { open: boolean; top: number }` (`top` is viewport-relative)
  - `type FolderAction = { kind: 'open' | 'close'; index: number } | null`
  - `decide(folders: FolderSnapshot[], line: number, gap = GAP): FolderAction`:
    1. If the last open folder has `top > line + gap`, close it.
    2. Otherwise, if the first closed folder has `top < line`, open it.
    3. Otherwise `null`.
  - `initFolders(doc: Document): void`. If `html` lacks `has-motion`, it returns without doing anything (all folders stay open). Otherwise it ports `expand` / `collapse` / `sync` / tab-click / `jumping` from mockup `opsi-b.html`, replacing its inline decision with `decide()` and its `line` maths with `computeLine()`. It re-measures and syncs on `resize` and on `langchange`.
- Test hooks on `<html>` (kept in production; harmless): `data-folders-line` (the current line in px) and `data-folders-busy` (`"1"` while an animation runs, removed when idle).
- Inline head script: `if (matchMedia('(prefers-reduced-motion: no-preference)').matches) document.documentElement.classList.add('has-motion')`.
- Closed-state CSS applies only under `html.has-motion .folder:not([data-open])`: `margin-inline: 3.5vw`, `.folder-body { height: calc(var(--V) + 20px); overflow: hidden; padding-bottom: 0 }`, `.folder-content { opacity: 0 }`. After each animation, clear the inline GSAP styles so that CSS stays the source of truth (as the mockup does).
- Animation values (port from mockup): open takes 0.9s `power3.inOut`; content opacity goes to 1 at 0.25s over 0.5s; `.pop` items go from `{y:44, opacity:0}` with stagger 0.07 and `back.out(1.5)` at 0.4s. Close takes 0.7s, with content opacity going to 0 over 0.3s. Tab click opens the folder and all folders above it instantly, then smooth-scrolls with a `scrollend` + 3000ms fallback.

- [ ] **Step 1: Write failing unit tests** `folders.test.ts`:
  - `computeLine(500, 1000)` → `420`. `computeLine(300, 1000)` → `220`. `computeLine(100, 1000)` → `200`.
  - `decide`, all closed at rest: `[{open:false,top:500},{…top:580}]` with line 420 → `null`.
  - First closed above line: `[{open:false,top:400}, …]` → `{kind:'open',index:0}`.
  - Opens in order only: `[{open:true,top:-300},{open:false,top:410},{open:false,top:415}]` → `{kind:'open',index:1}`.
  - Closes last open: `[{open:true,top:-300},{open:true,top:480}]`, line 420 → `{kind:'close',index:1}`.
  - Hysteresis: `[{open:true,top:-300},{open:true,top:450}]`, line 420 → `null`.
  - Never closes a middle folder first: `[{open:true,top:900},{open:true,top:1500}]` → `{kind:'close',index:1}`.
- [ ] **Step 2: Write failing e2e** `motion.spec.ts`. First add to `tests/e2e/helpers.ts`: `idle(page)`, which waits until `html` has no `data-folders-busy`, and `openIds(page): Promise<string[]>`, which returns the ids of `.folder[data-open]` in DOM order. Task 9 reuses both.
  - `closed stack at load`: `html.has-motion` and `openIds` is `[]`.
  - `scrolling down opens in order`: scroll in 150px steps to the bottom, calling `idle` after each step. At every step, `openIds` is a prefix of `['about','study','work','cert']`. At the end, all 4 are open.
  - `scrolling back to top closes all`: after the previous state, scroll to 0, poll `openIds` to `[]` (10s timeout).
  - `hysteresis band holds`: open About only, then scroll so About's top is `line + 24`. After 1.5s it is still open. Then scroll to put it at `line + 70` and wait for `idle`: it is closed.
  - `tab click opens folder and all above`: at the top, click `#cert .folder-tab` and wait for idle. All 4 are open, and `#cert` top is within `[-5, 80]`.
  - `End opens all, Home closes all`: press `End`, poll until 4 are open. Press `Home`, poll until 0 are open.
  - `language switch mid-animation leaves no clipped folder`: scroll to open About, click `ID` within 100ms, wait for idle. For each open `.folder-body`, `scrollHeight − clientHeight ≤ 1`.
  - `resize keeps the stack closed at the top`: start at 1280×800, then `setViewportSize(390, 844)`. `openIds` is `[]` at `scrollY` 0. After scrolling 200 and waiting for idle, `about` is open.
  - `reduced motion shows everything open`: emulate `reduce`, `html` lacks `has-motion`, and every `.folder-content` is visible with opacity `1`.
- [ ] **Step 3: Run** `npm test` and `npx playwright test motion`. Expected: FAIL.
- [ ] **Step 4: Implement** `folders.ts`, the closed-state CSS, the inline-script class and the wiring (a `<script>` in `index.astro` calling `initFolders(document)`).
- [ ] **Step 5: Run** `npm test` and `npx playwright test`. Expected: PASS (everything). The Task 5 and 6 content specs still pass because they use reduced motion.
- [ ] **Step 6: Commit** `feat: open and close folders on scroll (Mekar motion)`.

---

### Task 8: Footer, optional links, README and Open Graph image

**Files:**
- Create: `src/components/Footer.astro`, `scripts/og.mjs`, `README.md`, `public/favicon.svg`
- Create (generated, committed): `public/og.png`
- Modify: `src/pages/index.astro`, `package.json` (`og` script)
- Test: `tests/e2e/footer.spec.ts`

**Interfaces:**
- Consumes: `content.site`, `content.ui`, `Sticker`, `T`.
- Produces: `<Footer site ui />`, which shows the large name sticker, `Astro.site.host`, `<T text={site.thanks}>`, and links for Email (`mailto:`), LinkedIn, GitHub, WhatsApp (`https://wa.me/<digits>`) only when set, Instagram only when set, and Download CV (the per-language pair, as in the cover). External links use `target="_blank" rel="noopener"`.
- Produces `scripts/og.mjs`: it launches Playwright Chromium against `http://127.0.0.1:4321/` at 1200×630 (motion on, so the closed stack shows) and saves `public/og.png`. It assumes `npm run preview` is running.
- README (in Bahasa Indonesia, for the owner) covers:
  - running `npm run dev`, `npm test`, `npm run test:e2e`;
  - where all content lives (`src/data/content.ts`) and the `{ en, id }` rule;
  - replacing photos, certificates and CV files, and the meaning of the schema error messages;
  - regenerating `og.png` after changing the cover;
  - updating `site` in `astro.config.mjs` once the real address is known;
  - the reminder not to deploy before the real content is in.

- [ ] **Step 1: Write failing e2e** `footer.spec.ts` (with `gotoStatic`):
  - `optional links render only when set`: there is exactly one `a[href^="https://wa.me/"]` and no link containing `instagram.com`.
  - `contact links`: there is an `a[href^="mailto:"]`, and the LinkedIn and GitHub links have `rel` containing `noopener`.
  - `og image exists`: `GET /og.png` returns 200 with `content-type` `image/png`.
- [ ] **Step 2: Run** `npx playwright test footer`. Expected: FAIL.
- [ ] **Step 3: Implement** the footer, favicon and `og.mjs`. Run `npm run build`, start `npm run preview`, run `npm run og`, then stop the preview. Write the README.
- [ ] **Step 4: Run** `npx playwright test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add footer, README for content updates and OG image`.

---

### Task 9: Quality gate (accessibility, small screens, performance, visual check)

**Files:**
- Create: `tests/e2e/quality.spec.ts`, `scripts/lighthouse.mjs`
- Modify: whatever the checks expose (CSS or markup fixes only)

**Interfaces:**
- Produces `scripts/lighthouse.mjs`: it runs Lighthouse (mobile form factor, performance category) on `http://127.0.0.1:4321/` using Playwright's Chromium `executablePath()` through `chrome-launcher`. It prints the score, writes `lighthouse/report.html`, and exits non-zero when the score is below 90. Add the npm script `lighthouse`.

- [ ] **Step 1: Write failing/guarding tests** in `quality.spec.ts`:
  - `no horizontal scroll at 360px in en and id`: at 360×780 with `gotoStatic`, `noHorizontalScroll` is true. Click `ID` and it is still true. Also with motion on, scroll to the bottom, wait for idle, and check again.
  - `no serious a11y violations`: run `AxeBuilder` with `gotoStatic`, in en and in id, and with the lightbox open. Expect no violations with impact `serious` or `critical`.
  - `all images have alt in both languages`: every `img` has a non-empty `alt`. After `ID`, every `img[data-alt-id]` has `alt === data-alt-id`.
- [ ] **Step 2: Run** `npx playwright test quality`. Fix what fails (typically contrast on the cover, tab label wrapping at 360px, or missing labels) until it passes.
- [ ] **Step 3: Performance.** Run `npm run build`, `npm run preview` (in the background) and `npm run lighthouse`. Expected: score ≥ 90. If it is lower, apply the fixes the report names (image sizes/`widths`, lazy loading, font subsets) and re-run.
- [ ] **Step 4: Visual check against the mockup.** Open `http://localhost:4321` and `http://localhost:5180/opsi-b.html` in the browser pane at desktop and 390px widths. Compare the cover collage, folder stack, open/close feel and the certificate board. Fix any differences that change the character (polish is fine). Then show the owner the result.
- [ ] **Step 5: Run everything:** `npm test`, `npx playwright test`, `npm run build`. Expected: all PASS, and the build has no `astro check` errors.
- [ ] **Step 6: Commit** `test: add quality gate for a11y, small screens and performance`.

---

### Task 10 (gated): Deploy to Cloudflare, only after real content is in

**Do not start until the owner confirms that `src/data/content.ts`, the photos, certificates and CVs are real.** The steps need the owner's GitHub and Cloudflare accounts, and the owner performs or approves each step.

- [ ] **Step 1:** Run `npm test`, `npx playwright test` and `npm run lighthouse` on the real content. Expected: all pass, score ≥ 90.
- [ ] **Step 2:** The owner creates a GitHub repo, and the remote is added and pushed (with the owner's approval).
- [ ] **Step 3:** In the Cloudflare dashboard, the owner creates a project from the repo with build command `npm run build` and output `dist`. Use Pages, or Workers static assets if that is what Cloudflare offers by default.
- [ ] **Step 4:** Set `site` in `astro.config.mjs` to the assigned URL, regenerate `og.png`, commit and push.
- [ ] **Step 5:** In Cloudflare, turn on Web Analytics for the project.
- [ ] **Step 6:** Open the live URL on a phone. Check the cover, the folder motion, the EN/ID toggle, the lightbox and the CV download.
