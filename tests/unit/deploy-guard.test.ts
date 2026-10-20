import { describe, expect, it } from 'vitest';
import { findDummyLeftovers, refuseDummyOnCloudflare } from '../../src/data/deploy-guard';

const real = {
  site: { name: 'NISRINA PUTRI', links: { email: 'me@gmail.com' } },
  about: { intro: { en: 'For example, I like networks.', id: 'Contohnya, aku suka jaringan.' } },
};

const partlyDummy = {
  site: { name: 'NISRINA PUTRI' },
  about: { song: 'Judul Lagu Favorit' },
  work: { items: [{ details: { en: 'Dummy text. Describe it.', id: 'Teks dummy. Jelaskan.' } }] },
  certificates: { items: [{ alt: { en: 'Scan', id: 'Pindaian sertifikat (contoh)' }, credentialUrl: 'https://example.com/x' }] },
};

describe('findDummyLeftovers', () => {
  it('names every place that still holds dummy text', () => {
    expect(findDummyLeftovers(partlyDummy)).toEqual([
      'about.song',
      'work.items.0.details.en',
      'work.items.0.details.id',
      'certificates.items.0.alt.id',
      'certificates.items.0.credentialUrl',
    ]);
  });

  it('finds the dummy name whatever its spacing or letter case', () => {
    expect(findDummyLeftovers({ site: { name: ' Nama Kamu ' } })).toEqual(['site.name']);
  });

  it('finds nothing in real content', () => {
    expect(findDummyLeftovers(real)).toEqual([]);
  });

  it('skips images without reading their src', () => {
    let reads = 0;
    const image = {
      width: 10,
      height: 10,
      format: 'jpg',
      get src() {
        reads += 1;
        return '/placeholders/dummy.jpg';
      },
    };
    expect(findDummyLeftovers({ site: { portrait: image } })).toEqual([]);
    expect(reads).toBe(0);
  });
});

describe('refuseDummyOnCloudflare', () => {
  it('stops a Cloudflare Pages build while dummy text is left, naming where', () => {
    expect(() => refuseDummyOnCloudflare(partlyDummy, { CF_PAGES: '1' })).toThrow(
      /dummy content.*about\.song.*work\.items\.0\.details\.en/s,
    );
  });

  it('stops a Cloudflare Workers build too', () => {
    expect(() => refuseDummyOnCloudflare(partlyDummy, { WORKERS_CI: '1' })).toThrow(/dummy content/);
  });

  it('lets the dummy content build on your own computer', () => {
    expect(() => refuseDummyOnCloudflare(partlyDummy, {})).not.toThrow();
    expect(() => refuseDummyOnCloudflare(partlyDummy, { CF_PAGES: '' })).not.toThrow();
  });

  it('lets real content build on Cloudflare', () => {
    expect(() => refuseDummyOnCloudflare(real, { CF_PAGES: '1' })).not.toThrow();
  });
});
