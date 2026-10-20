/**
 * Text that only the dummy content uses. A field that still contains one of these was not replaced
 * yet. Compared without regard to letter case.
 */
const DUMMY_MARKERS = [
  'nama kamu',
  'your name',
  'namakamu',
  'nama lengkap',
  'full name',
  'dummy',
  '(contoh)',
  'placeholder',
  'example.com',
  'example training institute',
  'example organizer',
  'judul lagu favorit',
];

/** An imported image. Its `src` is never read: Astro would then publish the full-size original. */
const isImage = (value: object) => 'width' in value && 'height' in value && 'format' in value;

/** The dot-paths of every text field in `content` that still holds dummy text. */
export function findDummyLeftovers(content: unknown, path: string[] = []): string[] {
  if (typeof content === 'string') {
    const text = content.toLowerCase();
    return DUMMY_MARKERS.some((marker) => text.includes(marker)) ? [path.join('.')] : [];
  }
  if (typeof content !== 'object' || content === null || isImage(content)) return [];
  return Object.entries(content).flatMap(([key, value]) => findDummyLeftovers(value, [...path, key]));
}

/**
 * Stops a build on Cloudflare while content.ts still holds any dummy text, so placeholder content can
 * never go live by accident. Cloudflare sets CF_PAGES (Pages) or WORKERS_CI (Workers) while it builds;
 * a build on your own computer sets neither and is never stopped.
 */
export function refuseDummyOnCloudflare(content: unknown, env: Record<string, string | undefined>): void {
  const onCloudflare = Boolean(env.CF_PAGES || env.WORKERS_CI);
  if (!onCloudflare) return;
  const leftovers = findDummyLeftovers(content);
  if (leftovers.length === 0) return;
  throw new Error(
    `Not deploying the dummy content: src/data/content.ts still has placeholder text at ${leftovers.join(', ')}. ` +
      'Put your real content in first (README, section 7 "Jangan deploy dulu").',
  );
}
