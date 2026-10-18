import { fileURLToPath } from 'node:url';

// Content fixtures for the unit tests, so they never depend on what src/data/content.ts holds.

/** Stands in for public/ when CV and PDF paths are checked: cv/fixture.pdf, cv/fixture-id.pdf and certificates/fixture.pdf. */
export const FIXTURE_PUBLIC = fileURLToPath(new URL('../fixtures/public/', import.meta.url));

export const loc = (s: string) => ({ en: s, id: s });

// Loosely typed on purpose: tests poke invalid values into it.
export type Fixture = Record<string, any>;

/** The smallest valid content, with `img` as every image. */
export function fixtureContent(img: unknown): Fixture {
  return {
    site: {
      name: 'ALEX SAMPLE',
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

