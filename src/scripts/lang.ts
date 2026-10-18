export type Lang = 'en' | 'id';
export const LANG_KEY = 'lang';

/** Only `'id'` selects Indonesian; anything else (including `null`) is English. */
export function resolveLang(stored: string | null): Lang {
  return stored === 'id' ? 'id' : 'en';
}

/** Reads the stored language choice. Never throws: a denied or missing store means English. */
export function readStoredLang(storage: Pick<Storage, 'getItem'> | null): Lang {
  try {
    return resolveLang(storage ? storage.getItem(LANG_KEY) : null);
  } catch {
    return 'en';
  }
}

/** `window.localStorage`, or `null` when merely reading the property throws (private mode, blocked site data). */
export function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Sets the alt text of every `img[data-alt-en]` under `root` to its text in `lang`. */
export function syncImageAlts(root: ParentNode, lang: Lang): void {
  root.querySelectorAll<HTMLImageElement>('img[data-alt-en]').forEach((img) => {
    const alt = img.getAttribute(`data-alt-${lang}`);
    if (alt !== null) img.alt = alt;
  });
}

/**
 * Switches every language-dependent piece of the document that CSS cannot reach:
 * `<html lang>`, image alt text, the title, the meta description and the toggle
 * buttons' pressed state. Then announces the change with a `langchange` event on
 * the window.
 */
export function applyLang(doc: Document, lang: Lang): void {
  const root = doc.documentElement;
  root.lang = lang;

  syncImageAlts(doc, lang);

  const title = root.getAttribute(`data-title-${lang}`);
  if (title !== null) doc.title = title;

  const description = root.getAttribute(`data-desc-${lang}`);
  if (description !== null) {
    doc.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }

  doc.querySelectorAll<HTMLElement>('[data-set-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.setLang === lang));
  });

  doc.defaultView?.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

/**
 * Syncs the page to the stored language, then lets `[data-set-lang]` buttons change
 * it. The choice is stored best-effort: storage errors never block the switch.
 */
export function initLangToggle(doc: Document, storage: Storage | null): void {
  applyLang(doc, readStoredLang(storage));

  doc.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-set-lang]');
    if (!button) return;
    const lang = resolveLang(button.dataset.setLang ?? null);
    applyLang(doc, lang);
    try {
      storage?.setItem(LANG_KEY, lang);
    } catch {
      // Storage is unavailable; the language still applies for this page view.
    }
  });
}
