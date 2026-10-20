import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import Cover from '../../src/components/Cover.astro';
import Footer from '../../src/components/Footer.astro';
import AboutMe from '../../src/components/folders/AboutMe.astro';
import Certificates from '../../src/components/folders/Certificates.astro';
import StudyJourney from '../../src/components/folders/StudyJourney.astro';
import WhatIDo from '../../src/components/folders/WhatIDo.astro';
import { parseContent, type SiteContent } from '../../src/data/schema';
import photo from '../fixtures/photo.jpg';
import { FIXTURE_PUBLIC, type Fixture, fixtureContent } from './fixtures';

// The branches the real content may or may not use (a cover photo, WhatsApp and Instagram, one CV
// for both languages, certificate links), rendered from fixtures with Astro's Container API. The e2e
// tests check the built page against whatever src/data/content.ts holds, so they cannot count on any
// one of these being there.

/** Fixture content after the edit, parsed the way the build parses content.ts. */
function content(edit: (c: Fixture) => void = () => {}): SiteContent {
  const raw = fixtureContent(photo);
  edit(raw);
  return parseContent(raw, { publicDir: FIXTURE_PUBLIC });
}

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create({ astroConfig: { site: 'https://example.dev' } });
});

/** Renders a component and returns its HTML as a document to query. */
async function render(component: Parameters<AstroContainer['renderToString']>[0], props: Record<string, unknown>) {
  const html = await container.renderToString(component, { props });
  // The Container API needs Node's own URL, so the tests run in Node and parse the HTML with a
  // happy-dom window of their own. Its Document is typed apart from the DOM one but behaves the same.
  const { document } = new Window();
  document.body.innerHTML = html;
  return document as unknown as Document;
}

const hrefs = (document: Document, selector: string) =>
  [...document.querySelectorAll(selector)].map((a) => a.getAttribute('href'));

describe('Cover', () => {
  it('uses the gradient when there is no cover photo', async () => {
    const { site, ui } = content();
    const doc = await render(Cover, { site, ui });
    expect(doc.querySelector('header.cover')?.classList.contains('cover--fallback')).toBe(true);
    expect(doc.querySelectorAll('.cover-bg img')).toHaveLength(0);
  });

  it('shows the cover photo as a decorative backdrop when there is one', async () => {
    const { site, ui } = content((c) => {
      c.site.coverPhoto = photo;
    });
    const doc = await render(Cover, { site, ui });
    expect(doc.querySelector('header.cover')?.classList.contains('cover--fallback')).toBe(false);
    const backdrop = doc.querySelectorAll('.cover-bg img');
    expect(backdrop).toHaveLength(1);
    // Empty alt in both languages, and loaded first: it is the largest thing on the first screen.
    expect(backdrop[0].getAttribute('alt')).toBe('');
    expect(backdrop[0].getAttribute('data-alt-id')).toBe('');
    expect(backdrop[0].getAttribute('loading')).toBe('eager');
    expect(backdrop[0].getAttribute('fetchpriority')).toBe('high');
  });

  it('leaves the left corner out when it has no label, keeping the right one', async () => {
    const { site, ui } = content((c) => {
      delete c.site.cornerLeft;
    });
    const doc = await render(Cover, { site, ui });
    expect(doc.querySelectorAll('.cover-corner--left')).toHaveLength(0);
    expect(doc.querySelectorAll('.cover-corner--right')).toHaveLength(1);
  });

  it('leaves the CV button out until there is a CV', async () => {
    const { site, ui } = content((c) => {
      delete c.site.cv;
    });
    const doc = await render(Cover, { site, ui });
    expect(doc.querySelectorAll('.cv-link')).toHaveLength(0);
    // The sticker and the status still make up the identity row.
    expect(doc.querySelectorAll('.cover-id .sticker, .cover-id .status')).toHaveLength(2);
  });

  it('gives each language its own CV', async () => {
    const { site, ui } = content((c) => {
      c.site.cv = { en: '/cv/fixture.pdf', id: '/cv/fixture-id.pdf' };
    });
    const doc = await render(Cover, { site, ui });
    expect(hrefs(doc, '.cover-id .cv-link[data-l="en"]')).toEqual(['/cv/fixture.pdf']);
    expect(hrefs(doc, '.cover-id .cv-link[data-l="id"]')).toEqual(['/cv/fixture-id.pdf']);
  });

  it('offers the same file in both languages when there is a single CV', async () => {
    const { site, ui } = content((c) => {
      c.site.cv = { en: '/cv/fixture.pdf', id: '/cv/fixture.pdf' };
    });
    const doc = await render(Cover, { site, ui });
    const links = [...doc.querySelectorAll('.cover-id .cv-link')];
    expect(links.map((a) => [a.getAttribute('data-l'), a.getAttribute('href')])).toEqual([
      ['en', '/cv/fixture.pdf'],
      ['id', '/cv/fixture.pdf'],
    ]);
    for (const link of links) expect(link.hasAttribute('download')).toBe(true);
  });
});

describe('Footer', () => {
  const external = (doc: Document) =>
    [...doc.querySelectorAll('.links a[target="_blank"]')].map((a) => [a.textContent?.trim(), a.getAttribute('href'), a.getAttribute('rel')]);

  it('leaves out WhatsApp and Instagram when they are not set', async () => {
    const { site, ui } = content();
    const doc = await render(Footer, { site, ui });
    expect(external(doc)).toEqual([
      ['LinkedIn', 'https://linkedin.com/in/me', 'noopener'],
      ['GitHub', 'https://github.com/me', 'noopener'],
    ]);
    expect(hrefs(doc, '.links a[href^="mailto:"]')).toEqual(['mailto:me@example.com']);
    // Nothing is left behind for them: one list item each for Email, LinkedIn, GitHub and the CV pair.
    expect(doc.querySelectorAll('.links > li')).toHaveLength(4);
  });

  it('links WhatsApp and Instagram when they are set', async () => {
    const { site, ui } = content((c) => {
      c.site.links.whatsapp = '6281234567890';
      c.site.links.instagram = 'https://www.instagram.com/me';
    });
    const doc = await render(Footer, { site, ui });
    expect(external(doc)).toEqual([
      ['LinkedIn', 'https://linkedin.com/in/me', 'noopener'],
      ['GitHub', 'https://github.com/me', 'noopener'],
      ['WhatsApp', 'https://wa.me/6281234567890', 'noopener'],
      ['Instagram', 'https://www.instagram.com/me', 'noopener'],
    ]);
  });

  it('leaves the CV link out until there is a CV', async () => {
    const { site, ui } = content((c) => {
      delete c.site.cv;
    });
    const doc = await render(Footer, { site, ui });
    expect(doc.querySelectorAll('.cv-link')).toHaveLength(0);
    // Email, LinkedIn and GitHub, with no empty item left for the CV.
    expect(doc.querySelectorAll('.links > li')).toHaveLength(3);
  });

  it('shows the site address, the name and the CV links', async () => {
    const { site, ui } = content();
    const doc = await render(Footer, { site, ui });
    expect(doc.querySelector('.foot-url')?.textContent).toBe('example.dev');
    expect(doc.querySelector('.sticker b')?.textContent).toBe('ALEX SAMPLE');
    expect(hrefs(doc, '.links .cv-link')).toEqual(['/cv/fixture.pdf', '/cv/fixture.pdf']);
  });
});

describe('Certificates', () => {
  const certificate = (extra: Record<string, unknown>) => ({
    title: 'Cert',
    issuer: 'Issuer',
    year: 2024,
    image: photo,
    alt: { en: 'Scan', id: 'Pindaian' },
    ...extra,
  });

  it('links a credential and a PDF only where the certificate has them', async () => {
    const { certificates, ui } = content((c) => {
      c.certificates.items = [
        certificate({}),
        certificate({ credentialUrl: 'https://example.com/credential' }),
        certificate({ pdf: '/certificates/fixture.pdf' }),
        certificate({ credentialUrl: 'https://example.com/both', pdf: '/certificates/fixture.pdf' }),
      ];
    });
    const doc = await render(Certificates, { certificates, ui });
    const links = [1, 2, 3, 4].map((n) => {
      const template = doc.getElementById(`lb-cert-${n}`) as HTMLTemplateElement;
      return [...template.content.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    });
    expect(links).toEqual([
      [],
      ['https://example.com/credential'],
      ['/certificates/fixture.pdf'],
      ['https://example.com/both', '/certificates/fixture.pdf'],
    ]);
    // Cards are numbered in order.
    expect([...doc.querySelectorAll('.c-no')].map((el) => el.textContent)).toEqual(['01', '02', '03', '04']);
  });

  it('labels the credential link in both languages', async () => {
    const { certificates, ui } = content((c) => {
      c.certificates.items = [certificate({ credentialUrl: 'https://example.com/credential' })];
      c.ui.viewCredential = { en: 'View credential', id: 'Lihat kredensial' };
    });
    const doc = await render(Certificates, { certificates, ui });
    const link = (doc.getElementById('lb-cert-1') as HTMLTemplateElement).content.querySelector('a')!;
    expect(link.querySelector('[data-l="en"]')?.textContent).toBe('View credential');
    expect(link.querySelector('[data-l="id"]')?.textContent).toBe('Lihat kredensial');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});

describe('WhatIDo', () => {
  it('shows the gallery under the main photo, and just the photo for an item without one', async () => {
    const { work, ui } = content((c) => {
      const item = c.work.items[0];
      c.work.items = [
        { ...item, gallery: [{ image: photo, alt: { en: 'Two', id: 'Dua' } }, { image: photo, alt: { en: 'Three', id: 'Tiga' } }] },
        { ...item },
      ];
    });
    const doc = await render(WhatIDo, { work, ui });
    const alts = [1, 2].map((n) =>
      [...(doc.getElementById(`lb-work-${n}`) as HTMLTemplateElement).content.querySelectorAll('img')].map((img) => img.getAttribute('alt')),
    );
    expect(alts).toEqual([['Photo', 'Two', 'Three'], ['Photo']]);
  });
});

describe('AboutMe', () => {
  it('names the song on the cassette, or just says "now playing" without one', async () => {
    const label = async (song: string | undefined) => {
      const { about } = content((c) => {
        if (song === undefined) delete c.about.song;
        else c.about.song = song;
      });
      const doc = await render(AboutMe, { about });
      return doc.querySelector('.cas-label')?.textContent?.trim();
    };
    expect(await label('Lagu – Penyanyi')).toBe('now playing ♪ Lagu – Penyanyi');
    expect(await label(undefined)).toBe('now playing ♪');
  });
});

describe('StudyJourney', () => {
  it('marks only the items flagged as current, wherever they are', async () => {
    const step = (current: boolean) => ({ when: { en: 'w', id: 'w' }, title: { en: 't', id: 't' }, text: { en: 'x', id: 'x' }, current });
    const { study } = content((c) => {
      c.study.items = [step(false), step(true), step(false)];
    });
    const doc = await render(StudyJourney, { study });
    const items = [...doc.querySelectorAll('.timeline li')];
    expect(items.map((li) => li.classList.contains('now'))).toEqual([false, true, false]);
    expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  });

  it('splits a long journey into even rows', async () => {
    const step = { title: { en: 't', id: 't' }, text: { en: 'x', id: 'x' } };
    const columnsFor = async (count: number) => {
      const { study } = content((c) => {
        c.study.items = Array.from({ length: count }, () => ({ ...step }));
      });
      const doc = await render(StudyJourney, { study });
      return doc.querySelector('.timeline')?.getAttribute('style');
    };
    expect(await columnsFor(4)).toBe('--columns:4');
    expect(await columnsFor(5)).toBe('--columns:5');
    expect(await columnsFor(6)).toBe('--columns:3');
    expect(await columnsFor(7)).toBe('--columns:4');
  });

  it('leaves out a missing heading and a missing date', async () => {
    const { study } = content((c) => {
      delete c.study.heading;
      c.study.items = [
        { title: { en: 'No date', id: 'Tanpa tanggal' }, text: { en: 'x', id: 'x' } },
        { when: { en: '2024', id: '2024' }, title: { en: 't', id: 't' }, text: { en: 'x', id: 'x' } },
      ];
    });
    const doc = await render(StudyJourney, { study });
    expect(doc.querySelectorAll('.study h2')).toHaveLength(0);
    const dates = [...doc.querySelectorAll('.timeline li')].map((li) => li.querySelectorAll('.when').length);
    expect(dates).toEqual([0, 1]);
  });
});
