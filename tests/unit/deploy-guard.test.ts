import { describe, expect, it } from 'vitest';
import { DUMMY_NAME, refuseDummyOnCloudflare } from '../../src/data/deploy-guard';

describe('refuseDummyOnCloudflare', () => {
  it('stops a Cloudflare Pages build of the dummy content', () => {
    expect(() => refuseDummyOnCloudflare(DUMMY_NAME, { CF_PAGES: '1' })).toThrow(
      /dummy content.*site\.name in src\/data\/content\.ts is still "NAMA KAMU"/,
    );
  });

  it('stops a Cloudflare Workers build of the dummy content too', () => {
    expect(() => refuseDummyOnCloudflare(DUMMY_NAME, { WORKERS_CI: '1' })).toThrow(/dummy content/);
  });

  it('lets the dummy content build on your own computer', () => {
    expect(() => refuseDummyOnCloudflare(DUMMY_NAME, {})).not.toThrow();
    expect(() => refuseDummyOnCloudflare(DUMMY_NAME, { CF_PAGES: '' })).not.toThrow();
  });

  it('lets real content build on Cloudflare', () => {
    expect(() => refuseDummyOnCloudflare('NISRINA PUTRI', { CF_PAGES: '1' })).not.toThrow();
  });

  it('is not fooled by spacing or letter case', () => {
    expect(() => refuseDummyOnCloudflare(' Nama Kamu ', { CF_PAGES: '1' })).toThrow(/dummy content/);
  });
});
