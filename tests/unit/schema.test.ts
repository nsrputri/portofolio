import { describe, expect, it } from 'vitest';
import { parseContent as parseWith } from '../../src/data/schema';
import { content } from '../../src/data/content';
import { FIXTURE_PUBLIC, type Fixture, fixtureContent } from './fixtures';

// The fixtures check their CV and PDF paths against tests/fixtures/public instead of the real
// public/, so they keep working whatever files the owner puts there.
const parseContent = (raw: unknown) => parseWith(raw, { publicDir: FIXTURE_PUBLIC });

const img = { src: '/x.jpg', width: 1, height: 1, format: 'jpg' };
const valid = (): Fixture => fixtureContent(img);

// Mutate a fresh valid() fixture and return it for parseContent.
function mutated(edit: (c: Fixture) => void): Fixture {
  const c = valid();
  edit(c);
  return c;
}

describe('parseContent', () => {
  it('accepts a minimal valid object and applies defaults', () => {
    const parsed = parseContent(valid());
    expect(parsed.study.items[0].current).toBe(false);
    expect(parsed.work.items[0].gallery).toEqual([]);
  });

  it('names the failing path when a localized string is missing', () => {
    const raw = mutated((c) => {
      delete c.about.intro.id;
    });
    expect(() => parseContent(raw)).toThrow(/^Invalid content:/);
    expect(() => parseContent(raw)).toThrow(/- about\.intro\.id: /);
  });

  it('rejects a whitespace-only localized string', () => {
    const raw = mutated((c) => {
      c.site.status.en = '  ';
    });
    expect(() => parseContent(raw)).toThrow(/site\.status\.en/);
  });

  it('rejects an invalid email', () => {
    const raw = mutated((c) => {
      c.site.links.email = 'nope';
    });
    expect(() => parseContent(raw)).toThrow(/site\.links\.email/);
  });

  it('rejects a CV path that is not under /cv/ or not a pdf', () => {
    const raw = mutated((c) => {
      c.site.cv.en = '/files/cv.docx';
    });
    expect(() => parseContent(raw)).toThrow(/site\.cv\.en/);
  });

  it('treats whatsapp as optional digits only', () => {
    expect(() => parseContent(valid())).not.toThrow();
    const ok = mutated((c) => {
      c.site.links.whatsapp = '628123456789';
    });
    expect(() => parseContent(ok)).not.toThrow();
    const bad = mutated((c) => {
      c.site.links.whatsapp = '+62 812';
    });
    expect(() => parseContent(bad)).toThrow(/site\.links\.whatsapp/);
  });

  it('rejects an unknown work category', () => {
    const raw = mutated((c) => {
      c.work.items[0].category = 'hobby';
    });
    expect(() => parseContent(raw)).toThrow(/work\.items\.0\.category/);
  });

  it('rejects something that is not an imported image', () => {
    const raw = mutated((c) => {
      c.site.portrait = '/portrait.jpg';
    });
    expect(() => parseContent(raw)).toThrow(/site\.portrait: expected an imported image/);
  });

  // Astro counts every read of an imported image's `src` as using the original file, and then ships
  // the full-size original (EXIF and GPS included) next to the optimised copies.
  it('checks an image without reading its src', () => {
    let srcReads = 0;
    const tracked = { width: 1, height: 1, format: 'jpg' } as Record<string, unknown>;
    Object.defineProperty(tracked, 'src', {
      enumerable: true,
      get() {
        srcReads += 1;
        return '/x.jpg';
      },
    });
    const raw = mutated((c) => {
      c.site.portrait = tracked;
    });
    expect(() => parseContent(raw)).not.toThrow();
    expect(srcReads).toBe(0);
    const noSrc = mutated((c) => {
      c.site.portrait = { width: 1, height: 1, format: 'jpg' };
    });
    expect(() => parseContent(noSrc)).toThrow(/site\.portrait: expected an imported image/);
  });

  it('rejects empty lists and out-of-range years', () => {
    const noFacts = mutated((c) => {
      c.about.facts = [];
    });
    expect(() => parseContent(noFacts)).toThrow(/about\.facts/);
    const badYear = mutated((c) => {
      c.certificates.items[0].year = 1999;
    });
    expect(() => parseContent(badYear)).toThrow(/certificates\.items\.0\.year/);
  });

  it('requires the name sticker sub-line', () => {
    const missing = mutated((c) => {
      delete c.site.stickerSub;
    });
    expect(() => parseContent(missing)).toThrow(/- site\.stickerSub: /);
    const blank = mutated((c) => {
      c.site.stickerSub = '  ';
    });
    expect(() => parseContent(blank)).toThrow(/- site\.stickerSub: /);
  });

  it('rejects a misspelt optional key instead of silently dropping it', () => {
    const raw = mutated((c) => {
      c.site.links.instgram = 'https://instagram.com/me';
    });
    expect(() => parseContent(raw)).toThrow(/^Invalid content:/);
    expect(() => parseContent(raw)).toThrow(/- site\.links\.instgram: /);
  });

  it('rejects unknown keys at the top level, inside objects and inside array items', () => {
    const topLevel = mutated((c) => {
      c.skills = [];
    });
    expect(() => parseContent(topLevel)).toThrow(/- skills: /);
    const nested = mutated((c) => {
      c.work.items[0].gallry = [];
    });
    expect(() => parseContent(nested)).toThrow(/- work\.items\.0\.gallry: /);
    const localizedExtra = mutated((c) => {
      c.site.title.fr = 'Portfolio';
    });
    expect(() => parseContent(localizedExtra)).toThrow(/- site\.title\.fr: /);
  });

  it('reports every issue on its own line', () => {
    const raw = mutated((c) => {
      c.site.links.email = 'nope';
      c.site.cv.id = 'x';
    });
    let message = '';
    try {
      parseContent(raw);
    } catch (e) {
      message = (e as Error).message;
    }
    const lines = message.split('\n');
    expect(lines[0]).toBe('Invalid content:');
    expect(lines.filter((l) => l.startsWith('- '))).toHaveLength(2);
  });
});

describe('files under public/', () => {
  it('accepts a CV and a certificate PDF that exist', () => {
    const raw = mutated((c) => {
      c.certificates.items[0].pdf = '/certificates/fixture.pdf';
    });
    expect(() => parseContent(raw)).not.toThrow();
  });

  it('rejects a CV path whose file is missing, naming the field and the file', () => {
    const raw = mutated((c) => {
      c.site.cv.en = '/cv/CV-Nisrina-EN.pdf';
    });
    expect(() => parseContent(raw)).toThrow(/^Invalid content:/);
    expect(() => parseContent(raw)).toThrow(
      '- site.cv.en: file not found in public/ (looked for public/cv/CV-Nisrina-EN.pdf)',
    );
  });

  it('rejects a certificate PDF whose file is missing', () => {
    const raw = mutated((c) => {
      c.certificates.items[0].pdf = '/certificates/mtcna.pdf';
    });
    expect(() => parseContent(raw)).toThrow(
      '- certificates.items.0.pdf: file not found in public/ (looked for public/certificates/mtcna.pdf)',
    );
  });

  // Windows would find Fixture.pdf for fixture.pdf; the Linux build server and the host would not.
  it('compares file names case-sensitively', () => {
    const raw = mutated((c) => {
      c.site.cv.id = '/cv/Fixture.pdf';
    });
    expect(() => parseContent(raw)).toThrow(/- site\.cv\.id: file not found in public\//);
  });

  it('reports a malformed path once, without a second "not found" line', () => {
    const raw = mutated((c) => {
      c.site.cv.en = '/files/cv.docx';
    });
    expect(() => parseContent(raw)).toThrow(/- site\.cv\.en: /);
    expect(() => parseContent(raw)).not.toThrow(/not found/);
  });

  it('checks the real public/ folder when no folder is given', () => {
    const real = mutated((c) => {
      c.site.cv = { ...content.site.cv };
    });
    expect(() => parseWith(real)).not.toThrow();
    const missing = mutated((c) => {
      c.site.cv.en = '/cv/definitely-not-here.pdf';
    });
    expect(() => parseWith(missing)).toThrow(/- site\.cv\.en: file not found in public\//);
  });
});

// Whatever the owner writes in content.ts, it has to pass the same check the build runs. Nothing here
// pins the dummy text: the fixtures above and components.test.ts cover the optional branches.
describe('src/data/content.ts', () => {
  it('is valid content', () => {
    expect(() => parseWith(content)).not.toThrow();
  });
});

describe('optional content', () => {
  it('leaves out what is not set', () => {
    const parsed = parseContent(valid());
    expect(parsed.site.coverPhoto).toBeUndefined();
    expect(parsed.site.links.whatsapp).toBeUndefined();
    expect(parsed.site.links.instagram).toBeUndefined();
    expect(parsed.certificates.items[0].credentialUrl).toBeUndefined();
    expect(parsed.certificates.items[0].pdf).toBeUndefined();
  });

  it('keeps what is set', () => {
    const raw = mutated((c) => {
      c.site.coverPhoto = img;
      c.site.links.whatsapp = '6281234567890';
      c.site.links.instagram = 'https://www.instagram.com/me';
      c.certificates.items[0].credentialUrl = 'https://example.com/credential';
      c.certificates.items[0].pdf = '/certificates/fixture.pdf';
      c.work.items[0].gallery = [{ image: img, alt: { en: 'More', id: 'Lagi' } }];
      c.study.items[0].current = true;
    });
    const parsed = parseContent(raw);
    expect(parsed.site.coverPhoto).toBe(img);
    expect(parsed.site.links).toMatchObject({ whatsapp: '6281234567890', instagram: 'https://www.instagram.com/me' });
    expect(parsed.certificates.items[0]).toMatchObject({
      credentialUrl: 'https://example.com/credential',
      pdf: '/certificates/fixture.pdf',
    });
    expect(parsed.work.items[0].gallery).toHaveLength(1);
    expect(parsed.study.items[0].current).toBe(true);
  });

  it('accepts one CV file for both languages', () => {
    const raw = mutated((c) => {
      c.site.cv = { en: '/cv/fixture.pdf', id: '/cv/fixture.pdf' };
    });
    expect(parseContent(raw).site.cv).toEqual({ en: '/cv/fixture.pdf', id: '/cv/fixture.pdf' });
  });
});
