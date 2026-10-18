// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LANG_KEY,
  applyLang,
  initLangToggle,
  readStoredLang,
  resolveLang,
  safeLocalStorage,
  syncImageAlts,
} from '../../src/scripts/lang';

function setupDocument() {
  document.documentElement.lang = 'en';
  document.documentElement.dataset.titleEn = 'A';
  document.documentElement.dataset.titleId = 'B';
  document.documentElement.dataset.descEn = 'desc A';
  document.documentElement.dataset.descId = 'desc B';
  document.head.innerHTML = '<title>A</title><meta name="description" content="desc A">';
  document.body.innerHTML = `
    <img data-alt-en="x" data-alt-id="y" alt="x">
    <button data-set-lang="en" aria-pressed="true">EN</button>
    <button data-set-lang="id" aria-pressed="false">ID</button>
  `;
}

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe('resolveLang', () => {
  it('defaults to en when nothing is stored', () => {
    expect(resolveLang(null)).toBe('en');
  });

  it('accepts id', () => {
    expect(resolveLang('id')).toBe('id');
  });

  it('falls back to en for unknown values', () => {
    expect(resolveLang('fr')).toBe('en');
    expect(resolveLang('')).toBe('en');
  });
});

describe('readStoredLang', () => {
  it('reads the stored choice', () => {
    expect(readStoredLang(memoryStorage({ [LANG_KEY]: 'id' }))).toBe('id');
  });

  it('returns en when storage is null', () => {
    expect(readStoredLang(null)).toBe('en');
  });

  it('never throws when storage access is denied', () => {
    const denied = {
      getItem: () => {
        throw new Error('denied');
      },
    };
    expect(readStoredLang(denied)).toBe('en');
  });
});

describe('safeLocalStorage', () => {
  it('returns window.localStorage when accessible', () => {
    expect(safeLocalStorage()).toBe(window.localStorage);
  });

  it('returns null when accessing localStorage throws', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    try {
      expect(safeLocalStorage()).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('syncImageAlts', () => {
  it('sets alt text only inside the given root, so a detached fragment can be synced', () => {
    document.body.innerHTML = '<img data-alt-en="page en" data-alt-id="page id" alt="page en">';
    const fragment = document.createElement('div');
    fragment.innerHTML = '<img data-alt-en="a" data-alt-id="b" alt="a"><img alt="plain">';

    syncImageAlts(fragment, 'id');

    const [synced, plain] = fragment.querySelectorAll('img');
    expect(synced.alt).toBe('b');
    expect(plain.alt).toBe('plain');
    expect(document.querySelector('img')!.alt).toBe('page en');
  });
});

describe('applyLang', () => {
  beforeEach(setupDocument);

  it('switches lang, title, description, image alt and button state to id', () => {
    applyLang(document, 'id');
    expect(document.documentElement.lang).toBe('id');
    expect(document.title).toBe('B');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('desc B');
    expect(document.querySelector('img')?.alt).toBe('y');
    expect(document.querySelector('[data-set-lang="id"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-set-lang="en"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('switches back to en', () => {
    applyLang(document, 'id');
    applyLang(document, 'en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('A');
    expect(document.querySelector('img')?.alt).toBe('x');
    expect(document.querySelector('[data-set-lang="en"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('dispatches langchange with the new language on the window', () => {
    const seen: string[] = [];
    const onChange = (e: Event) => seen.push((e as CustomEvent).detail.lang);
    window.addEventListener('langchange', onChange);
    try {
      applyLang(document, 'id');
    } finally {
      window.removeEventListener('langchange', onChange);
    }
    expect(seen).toEqual(['id']);
  });
});

describe('initLangToggle', () => {
  beforeEach(setupDocument);

  it('applies the clicked language and stores it', () => {
    const storage = memoryStorage();
    initLangToggle(document, storage);
    document.querySelector<HTMLButtonElement>('[data-set-lang="id"]')!.click();
    expect(document.documentElement.lang).toBe('id');
    expect(storage.getItem(LANG_KEY)).toBe('id');
  });

  it('syncs the page to the stored choice on init', () => {
    const storage = memoryStorage({ [LANG_KEY]: 'id' });
    initLangToggle(document, storage);
    expect(document.documentElement.lang).toBe('id');
    expect(document.title).toBe('B');
    expect(document.querySelector('[data-set-lang="id"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('still switches language when storage throws on write', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('quota');
    };
    initLangToggle(document, storage);
    document.querySelector<HTMLButtonElement>('[data-set-lang="id"]')!.click();
    expect(document.documentElement.lang).toBe('id');
  });

  it('works without any storage', () => {
    initLangToggle(document, null);
    document.querySelector<HTMLButtonElement>('[data-set-lang="id"]')!.click();
    expect(document.documentElement.lang).toBe('id');
  });
});
