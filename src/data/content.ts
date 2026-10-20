// All user-visible content lives here and is validated at build time by schema.ts.
// Filled in from bahan/ISI-KONTEN.md. Sections still waiting for the owner are left out of the page:
// What I Do and Certificates show once they have an item, the Download CV buttons once `cv` is set.
// A Cloudflare build refuses to run while any dummy text is left (src/data/deploy-guard.ts).
// `*word*` renders as emphasis, `\n` as a line break (see src/lib/rich.ts).
import portrait from '../assets/foto/nisrina-potret.jpg';
import coverPhoto from '../assets/foto/latar-cover.jpg';
import certFiberOptik from '../assets/sertifikat/fiber-optik-bnsp.png';
import { parseContent, type SiteContent } from './schema';

const portraitAlt = {
  en: 'Portrait of Nisrina Putri in a white dress and a beige hijab',
  id: 'Potret Nisrina Putri mengenakan gamis putih dan hijab krem',
};

export const content: SiteContent = parseContent({
  site: {
    name: 'NISRINA PUTRI',
    stickerSub: 'Teknologi Rekayasa Internet · DTEDI · UGM',
    title: {
      en: 'Nisrina Putri · Internet Engineering Technology Portfolio',
      id: 'Nisrina Putri · Portofolio Teknologi Rekayasa Internet',
    },
    description: {
      en: 'Portfolio of Nisrina Putri, an Internet Engineering Technology student at UGM, open to internships in internet and networking.',
      id: 'Portofolio Nisrina Putri, mahasiswi Teknologi Rekayasa Internet UGM yang terbuka untuk magang di bidang internet dan jaringan.',
    },
    cornerRight: {
      en: 'NISRINA PUTRI FATIMAH AZZAHRA\nUGM · VOCATIONAL SCHOOL',
      id: 'NISRINA PUTRI FATIMAH AZZAHRA\nUGM · SEKOLAH VOKASI',
    },
    // Written in English by the owner; kept in English in both languages, like the reference design.
    tagline: {
      en: 'small steps *forward*,\nendless *possibilities*.',
      id: 'small steps *forward*,\nendless *possibilities*.',
    },
    note: {
      en: "Hi! I'm a 5th-semester TRI UGM student, ready to dive into the internet & networking industry :)",
      id: 'Hai! Aku mahasiswi TRI UGM semester 5 yang siap terjun ke industri internet & jaringan :)',
    },
    status: { en: 'Open for internship', id: 'Terbuka untuk magang' },
    thanks: {
      en: "Thanks for stopping by! I'm open to internship opportunities in internet & networking.",
      id: 'Terima kasih sudah mampir! Aku terbuka untuk kesempatan magang di bidang internet & jaringan.',
    },
    portrait,
    portraitAlt,
    coverPhoto,
    links: {
      email: 'nisrinaputri2912@gmail.com',
      linkedin: 'https://www.linkedin.com/in/nisrinaputri2912',
      github: 'https://github.com/nsrputri',
      whatsapp: '6287818126030',
      instagram: 'https://www.instagram.com/nsrputrii/',
    },
  },

  ui: {
    folders: {
      about: { en: 'About Me', id: 'Tentang Aku' },
      study: { en: 'Study Journey', id: 'Perjalanan Kuliah' },
      work: { en: 'What I Do', id: 'Yang Aku Lakukan' },
      cert: { en: 'Certificates', id: 'Sertifikat' },
    },
    downloadCv: { en: 'Download CV', id: 'Unduh CV' },
    close: { en: 'Close', id: 'Tutup' },
    language: { en: 'Language', id: 'Bahasa' },
    viewCredential: { en: 'View credential', id: 'Lihat kredensial' },
    categories: {
      practicum: { en: 'Practicum', id: 'Praktikum' },
      project: { en: 'Project', id: 'Proyek' },
      organization: { en: 'Organization', id: 'Organisasi' },
      competition: { en: 'Competition', id: 'Lomba' },
    },
  },

  about: {
    kicker: { en: '// about me', id: '// tentang aku' },
    heading: {
      en: "I'm *Nisrina Putri*, an Internet Engineering Technology student with a strong drive to dig deep into network infrastructure and technology.",
      id: 'Aku *Nisrina Putri*, mahasiswi Teknologi Rekayasa Internet dengan minat tinggi untuk mendalami bidang infrastruktur jaringan dan teknologi.',
    },
    intro: {
      en: "Hello! I'm Nisrina Putri, an Internet Engineering Technology student at UGM with a keen interest in network architecture. To me, networking is fascinating because it is the foundation that connects the entire digital ecosystem. Driven by a strong curiosity, I'm always eager to broaden my technical knowledge through study and collaboration in the technology industry.",
      id: 'Halo! Saya Nisrina Putri, mahasiswi Teknologi Rekayasa Internet UGM yang punya ketertarikan pada arsitektur jaringan. Bagi saya, dunia jaringan sangat memikat karena merupakan fondasi yang menghubungkan seluruh ekosistem digital. Terdorong oleh rasa ingin tahu yang besar, saya selalu bersemangat memperluas wawasan teknis melalui studi dan kolaborasi di bidang industri teknologi.',
    },
    photo: portrait,
    photoAlt: portraitAlt,
    caption: { en: "hi, it's me!", id: 'hai, ini aku!' },
    facts: [
      {
        label: { en: 'Campus', id: 'Kampus' },
        value: { en: 'UGM · Vocational School', id: 'UGM · Sekolah Vokasi' },
      },
      {
        label: { en: 'Major', id: 'Jurusan' },
        value: { en: 'TRI · DTEDI', id: 'TRI · DTEDI' },
      },
      {
        label: { en: 'Class of', id: 'Angkatan' },
        value: { en: '2024', id: '2024' },
      },
      {
        label: { en: 'Semester', id: 'Semester' },
        value: { en: '5', id: '5' },
      },
      {
        label: { en: 'GPA', id: 'IPK' },
        value: { en: '3.82', id: '3,82' },
      },
      {
        label: { en: 'Based in', id: 'Domisili' },
        value: { en: 'Yogyakarta', id: 'Yogyakarta' },
      },
    ],
    skills: ['Mikrotik', 'Cisco Packet Tracer', 'Wireshark', 'Linux', 'Ubuntu'],
  },

  // The owner's list, newest first. Steps without a date wait for one (when is optional).
  study: {
    kicker: { en: '// study journey', id: '// perjalanan kuliah' },
    items: [
      {
        when: { en: '2024 — Present', id: '2024 — Sekarang' },
        title: {
          en: 'Diploma IV, Internet Engineering Technology',
          id: 'Diploma IV, Teknologi Rekayasa Internet',
        },
        text: { en: 'Universitas Gadjah Mada', id: 'Universitas Gadjah Mada' },
        current: true,
      },
      {
        when: { en: 'Oct 2024 — Present', id: 'Okt 2024 — Sekarang' },
        title: { en: 'Public Relations Division', id: 'Divisi Humas' },
        text: { en: 'Forkom TRI SV UGM', id: 'Forkom TRI SV UGM' },
        current: true,
      },
      {
        title: { en: 'Database Practicum Assistant', id: 'Asisten Praktikum Basis Data' },
        text: { en: 'DTEDI SV UGM', id: 'DTEDI SV UGM' },
      },
      {
        title: {
          en: 'Equipment Sub-coordinator, Catering Division',
          id: 'Sub Koordinator Perlengkapan, Divisi Konsum',
        },
        text: { en: 'NetComp 4.0', id: 'NetComp 4.0' },
      },
      {
        title: {
          en: 'Equipment Staff, Catering Division',
          id: 'Anggota Perlengkapan, Divisi Konsum',
        },
        text: { en: 'NetComp 3.0', id: 'NetComp 3.0' },
      },
      {
        when: { en: '2021 — 2024', id: '2021 — 2024' },
        title: { en: 'SMA Negeri 5 Yogyakarta', id: 'SMA Negeri 5 Yogyakarta' },
        text: { en: 'Senior high school', id: 'Sekolah menengah atas' },
      },
    ],
  },

  work: {
    kicker: { en: '// what I do at uni', id: '// yang aku kerjakan di kuliah' },
    heading: {
      en: 'Practicums, projects, *and committees.*',
      id: 'Praktikum, proyek, *dan kepanitiaan.*',
    },
    // The owner's activities go here; the What I Do folder shows once there is at least one.
    items: [],
  },

  certificates: {
    items: [
      {
        title: 'Training Fiber Optik Bersertifikasi BNSP',
        issuer: 'LPK Pasopati',
        year: 2026,
        image: certFiberOptik,
        alt: {
          en: 'Certificate from LPK Pasopati for the BNSP-certified Fiber Optic Training, 11–13 March 2026, awarded to Nisrina Putri Fatimah Azzahra',
          id: 'Sertifikat LPK Pasopati untuk Training Fiber Optik Bersertifikasi BNSP, 11–13 Maret 2026, atas nama Nisrina Putri Fatimah Azzahra',
        },
      },
    ],
  },
});
