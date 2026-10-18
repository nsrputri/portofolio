import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseContent as parseWith } from '../../src/data/schema';
import { content } from '../../src/data/content';

// The fixtures check their CV and PDF paths against this folder instead of the real public/, so they
// keep working whatever files the owner puts there. It holds cv/fixture.pdf and certificates/fixture.pdf.
const FIXTURE_PUBLIC = fileURLToPath(new URL('../fixtures/public/', import.meta.url));
const parseContent = (raw: unknown) => parseWith(raw, { publicDir: FIXTURE_PUBLIC });

const img = { src: '/x.jpg', width: 1, height: 1, format: 'jpg' };
const loc = (s: string) => ({ en: s, id: s });

// Loosely typed on purpose: tests poke invalid values into it.
type Fixture = Record<string, any>;

function valid(): Fixture {
  return {
    site: {
      name: 'NAMA KAMU',
      stickerSub: 'TRI · DTEDI · UGM',
      title: loc('Portfolio'),
      description: loc('A portfolio.'),
      cornerLeft: loc('PORTFOLIO 2026'),
      cornerRight: loc('NAMA LENGKAP'),
      tagline: loc('stay *curious*'),
      note: loc('Hi!'),
      status: loc('Open to internship'),
      thanks: loc('Thanks for stopping by.'),
      portrait: img,
      portraitAlt: loc('Portrait'),
      cv: { en: '/cv/fixture.pdf', id: '/cv/fixture.pdf' },
      links: {
        email: 'me@example.com',
        linkedin: 'https://linkedin.com/in/me',
        github: 'https://github.com/me',
      },
    },
    ui: {
      folders: { about: loc('About'), study: loc('Study'), work: loc('Work'), cert: loc('Certs') },
      downloadCv: loc('Download CV'),
      close: loc('Close'),
      language: loc('Language'),
      viewCredential: loc('View credential'),
      categories: {
        practicum: loc('Practicum'),
        project: loc('Project'),
        organization: loc('Organization'),
        competition: loc('Competition'),
      },
    },
    about: {
      kicker: loc('// about'),
      heading: loc('Hi'),
      intro: loc('Intro'),
      photo: img,
      photoAlt: loc('Photo'),
      caption: loc('hello'),
      facts: [{ label: loc('Campus'), value: loc('UGM') }],
      skills: ['Mikrotik'],
      song: 'now playing',
    },
    study: {
      kicker: loc('// study'),
      heading: loc('Study'),
      items: [{ when: loc('2023'), title: loc('Start'), text: loc('Began.') }],
    },
    work: {
      kicker: loc('// work'),
      heading: loc('Work'),
      items: [
        {
          category: 'practicum',
          title: loc('Lab'),
          meta: loc('Lab · 2024'),
          details: loc('Details'),
          photo: img,
          photoAlt: loc('Photo'),
        },
      ],
    },
    certificates: {
      items: [{ title: 'MTCNA', issuer: 'MikroTik', year: 2024, image: img, alt: loc('Scan') }],
    },
  };
}

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

describe('dummy content', () => {
  it('parses and has the expected shape', () => {
    expect(() => parseWith(content)).not.toThrow();
    expect(content.work.items).toHaveLength(4);
    expect(content.certificates.items).toHaveLength(4);
    expect(content.about.facts).toHaveLength(4);
    expect(content.about.skills).toHaveLength(5);
    expect(content.work.items[0].category).toBe('practicum');
    expect(content.study.items.at(-1)?.current).toBe(true);
    expect(content.site.coverPhoto).toBeUndefined();
    expect(content.site.links.instagram).toBeUndefined();
  });

  it('carries the agreed UI strings', () => {
    expect(content.ui.downloadCv).toEqual({ en: 'Download CV', id: 'Unduh CV' });
    expect(content.ui.close).toEqual({ en: 'Close', id: 'Tutup' });
    expect(content.ui.language).toEqual({ en: 'Language', id: 'Bahasa' });
    expect(content.ui.viewCredential).toEqual({ en: 'View credential', id: 'Lihat kredensial' });
    expect(content.ui.categories.practicum).toEqual({ en: 'Practicum', id: 'Praktikum' });
    expect(content.ui.categories.project).toEqual({ en: 'Project', id: 'Proyek' });
    expect(content.ui.categories.organization).toEqual({ en: 'Organization', id: 'Organisasi' });
    expect(content.ui.categories.competition).toEqual({ en: 'Competition', id: 'Lomba' });
    expect(content.site.status).toEqual({ en: 'Open to internship', id: 'Terbuka untuk magang' });
    expect(content.site.name).toBe('NAMA KAMU');
    expect(content.site.stickerSub).toBe('TRI · DTEDI · UGM');
    expect(content.site.tagline).toEqual({
      en: 'stay *curious*,\nstay *connected*',
      id: 'tetap *penasaran*,\ntetap *terhubung*',
    });
  });
});
