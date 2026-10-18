/** The name the dummy content in content.ts comes with. */
export const DUMMY_NAME = 'NAMA KAMU';

/**
 * Stops a build on Cloudflare while content.ts still holds the dummy content, so the placeholder site
 * can never go live by accident. Cloudflare sets CF_PAGES (Pages) or WORKERS_CI (Workers) while it
 * builds; a build on your own computer sets neither and is never stopped.
 */
export function refuseDummyOnCloudflare(name: string, env: Record<string, string | undefined>): void {
  const onCloudflare = Boolean(env.CF_PAGES || env.WORKERS_CI);
  if (onCloudflare && name.trim().toUpperCase() === DUMMY_NAME) {
    throw new Error(
      `Not deploying the dummy content: site.name in src/data/content.ts is still "${DUMMY_NAME}". ` +
        'Put your real content in first (README, section 7 "Jangan deploy dulu").',
    );
  }
}
