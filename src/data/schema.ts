import type { ImageMetadata } from 'astro';
import { z } from 'astro/zod';

// Every object here is strict: an unknown key (a typo such as `links.instgram`) fails the
// build instead of being silently dropped.

/** A user-visible string in both languages. Whitespace-only counts as empty. */
export const localized = z.strictObject({
  en: z.string().trim().min(1),
  id: z.string().trim().min(1),
});
export type Localized = z.infer<typeof localized>;

/** An image imported through Astro's asset pipeline (`import x from '...jpg'`). */
const image = z.custom<ImageMetadata>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ImageMetadata).src === 'string' &&
    typeof (value as ImageMetadata).width === 'number' &&
    typeof (value as ImageMetadata).height === 'number',
  { message: 'expected an imported image' },
);

const galleryImage = z.strictObject({ image, alt: localized });

const workItem = z.strictObject({
  category: z.enum(['practicum', 'project', 'organization', 'competition']),
  title: localized,
  meta: localized,
  details: localized,
  photo: image,
  photoAlt: localized,
  gallery: z.array(galleryImage).default([]),
});

const certificate = z.strictObject({
  title: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  year: z.number().int().min(2000).max(2100),
  image,
  alt: localized,
  credentialUrl: z.url().optional(),
  pdf: z.string().regex(/^\/certificates\/[\w.-]+\.pdf$/).optional(),
});

const cvPath = z.string().regex(/^\/cv\/[\w.-]+\.pdf$/);

export const siteSchema = z.strictObject({
  site: z.strictObject({
    name: z.string().trim().min(1),
    /** Small line under the barcode on the name sticker. Not translated. */
    stickerSub: z.string().trim().min(1),
    title: localized,
    description: localized,
    cornerLeft: localized,
    cornerRight: localized,
    tagline: localized,
    note: localized,
    status: localized,
    thanks: localized,
    portrait: image,
    portraitAlt: localized,
    coverPhoto: image.optional(),
    cv: z.strictObject({ en: cvPath, id: cvPath }),
    links: z.strictObject({
      email: z.email(),
      linkedin: z.url(),
      github: z.url(),
      whatsapp: z.string().regex(/^\d{8,15}$/).optional(),
      instagram: z.url().optional(),
    }),
  }),
  ui: z.strictObject({
    folders: z.strictObject({
      about: localized,
      study: localized,
      work: localized,
      cert: localized,
    }),
    downloadCv: localized,
    close: localized,
    language: localized,
    viewCredential: localized,
    categories: z.strictObject({
      practicum: localized,
      project: localized,
      organization: localized,
      competition: localized,
    }),
  }),
  about: z.strictObject({
    kicker: localized,
    heading: localized,
    intro: localized,
    photo: image,
    photoAlt: localized,
    caption: localized,
    facts: z.array(z.strictObject({ label: localized, value: localized })).min(1),
    skills: z.array(z.string().trim().min(1)).min(1),
    song: z.string().trim().min(1),
  }),
  study: z.strictObject({
    kicker: localized,
    heading: localized,
    items: z
      .array(
        z.strictObject({
          when: localized,
          title: localized,
          text: localized,
          current: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
  work: z.strictObject({
    kicker: localized,
    heading: localized,
    items: z.array(workItem).min(1),
  }),
  certificates: z.strictObject({
    items: z.array(certificate).min(1),
  }),
});

export type SiteContent = z.infer<typeof siteSchema>;

/**
 * Validates raw content and returns the typed result. On failure it throws an
 * Error listing every issue as `- <dot.path>: <message>` so a bad edit to
 * content.ts is easy to locate from the build output.
 */
export function parseContent(raw: unknown): SiteContent {
  const result = siteSchema.safeParse(raw);
  if (result.success) return result.data;
  const lines = result.error.issues.flatMap((issue) => {
    const path = issue.path.map(String);
    // Zod reports unknown keys on their parent object. Name each key so a typo is easy to find.
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => `- ${[...path, key].join('.')}: unknown key`);
    }
    return [`- ${path.join('.') || '(root)'}: ${issue.message}`];
  });
  throw new Error(`Invalid content:\n${lines.join('\n')}`);
}
