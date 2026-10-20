import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

/**
 * An image imported through Astro's asset pipeline (`import x from '...jpg'`). It only asks whether
 * `src` is there and never reads it: Astro treats a read of `src` as the page using the original file
 * and then publishes the full-size original, EXIF data included, next to the optimised copies.
 */
const image = z.custom<ImageMetadata>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    'src' in value &&
    typeof (value as ImageMetadata).width === 'number' &&
    typeof (value as ImageMetadata).height === 'number',
  { message: 'expected an imported image' },
);

const galleryImage = z.strictObject({ image, alt: localized });

/** A web address that starts with https://. A javascript: link would run code when clicked. */
const httpsUrl = z.url({ protocol: /^https$/, error: 'expected a full address starting with https://' });

const workItem = z.strictObject({
  category: z.enum(['practicum', 'project', 'organization', 'competition']),
  title: localized,
  meta: localized,
  details: localized,
  photo: image,
  photoAlt: localized,
  gallery: z.array(galleryImage).default([]),
});

/** The folder the site's static files are copied from. The build runs from the project folder. */
const PUBLIC_DIR = join(process.cwd(), 'public');

/**
 * True when `urlPath` (such as `/cv/cv-en.pdf`) names a file inside `publicDir`. Names are compared
 * one folder at a time, upper and lower case included: Windows would also open `CV-EN.pdf` for
 * `cv-en.pdf`, but the Linux build server and the host would not, and the link would be dead.
 */
export function existsInPublic(urlPath: string, publicDir: string): boolean {
  let path = publicDir;
  for (const name of urlPath.split('/').filter(Boolean)) {
    try {
      if (!readdirSync(path).includes(name)) return false;
    } catch {
      return false;
    }
    path = join(path, name);
  }
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * A link to a file in public/, such as a CV. The file has to be there: a typo would otherwise ship a
 * dead Download CV button. A path in the wrong format gets only the format error, not a second one.
 */
function publicFile(format: RegExp, publicDir: string) {
  return z
    .string()
    .regex(format, { abort: true })
    .refine((path) => existsInPublic(path, publicDir), {
      error: (issue) => `file not found in public/ (looked for public${String(issue.input)})`,
    });
}

/** The content schema. `publicDir` is where CV and certificate PDF paths must exist (tests point it elsewhere). */
export function contentSchema(publicDir: string = PUBLIC_DIR) {
  const certificate = z.strictObject({
    title: z.string().trim().min(1),
    issuer: z.string().trim().min(1),
    year: z.number().int().min(2000).max(2100),
    image,
    alt: localized,
    credentialUrl: httpsUrl.optional(),
    pdf: publicFile(/^\/certificates\/[\w.-]+\.pdf$/, publicDir).optional(),
  });

  const cvPath = publicFile(/^\/cv\/[\w.-]+\.pdf$/, publicDir);

  return z.strictObject({
    site: z.strictObject({
      name: z.string().trim().min(1),
      /** Small line under the barcode on the name sticker. Not translated. */
      stickerSub: z.string().trim().min(1),
      title: localized,
      description: localized,
      /** Small label in the cover's top-left corner. Leave it out for no label there. */
      cornerLeft: localized.optional(),
      cornerRight: localized,
      tagline: localized,
      note: localized,
      status: localized,
      thanks: localized,
      portrait: image,
      portraitAlt: localized,
      coverPhoto: image.optional(),
      /** Leave it out until there is a CV: the Download CV buttons are then not shown. */
      cv: z.strictObject({ en: cvPath, id: cvPath }).optional(),
      links: z.strictObject({
        email: z.email(),
        linkedin: httpsUrl,
        github: httpsUrl,
        whatsapp: z.string().regex(/^\d{8,15}$/).optional(),
        instagram: httpsUrl.optional(),
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
      /** Leave it out for a cassette that just says "now playing". */
      song: z.string().trim().min(1).optional(),
    }),
    study: z.strictObject({
      kicker: localized,
      /** Leave it out for a timeline with no heading above it. */
      heading: localized.optional(),
      items: z
        .array(
          z.strictObject({
            /** Leave it out when the step has no date yet. */
            when: localized.optional(),
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
      /** While empty, the What I Do folder is not shown (see visible-folders.ts). */
      items: z.array(workItem),
    }),
    certificates: z.strictObject({
      /** While empty, the Certificates folder is not shown (see visible-folders.ts). */
      items: z.array(certificate),
    }),
  });
}

export const siteSchema = contentSchema();

export type SiteContent = z.infer<typeof siteSchema>;

/**
 * Validates raw content and returns the typed result. On failure it throws an
 * Error listing every issue as `- <dot.path>: <message>` so a bad edit to
 * content.ts is easy to locate from the build output.
 */
export function parseContent(raw: unknown, { publicDir }: { publicDir?: string } = {}): SiteContent {
  const result = (publicDir === undefined ? siteSchema : contentSchema(publicDir)).safeParse(raw);
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
