// All user-visible content lives here and is validated at build time by schema.ts.
// Everything below is DUMMY text and placeholder images. Replace it before launch.
// `*word*` renders as emphasis, `\n` as a line break (see src/lib/rich.ts).
import portrait from '../assets/placeholders/portrait.jpg';
import work1 from '../assets/placeholders/work-1.jpg';
import work1Extra1 from '../assets/placeholders/work-1-extra-1.jpg';
import work1Extra2 from '../assets/placeholders/work-1-extra-2.jpg';
import work2 from '../assets/placeholders/work-2.jpg';
import work3 from '../assets/placeholders/work-3.jpg';
import work4 from '../assets/placeholders/work-4.jpg';
import cert1 from '../assets/placeholders/cert-1.jpg';
import cert2 from '../assets/placeholders/cert-2.jpg';
import cert3 from '../assets/placeholders/cert-3.jpg';
import cert4 from '../assets/placeholders/cert-4.jpg';
import { parseContent, type SiteContent } from './schema';

export const content: SiteContent = parseContent({
  site: {
    name: 'NAMA KAMU',
    title: {
      en: 'Your Name · Internet Engineering Portfolio',
      id: 'Nama Kamu · Portofolio Teknologi Rekayasa Internet',
    },
    description: {
      en: 'Portfolio of an Internet Engineering Technology student at UGM, open to internships in internet and networking.',
      id: 'Portofolio mahasiswa Teknologi Rekayasa Internet UGM yang terbuka untuk magang di bidang internet dan jaringan.',
    },
    cornerLeft: {
      en: 'PORTFOLIO 2026\nINTERNET ENGINEERING TECHNOLOGY',
      id: 'PORTFOLIO 2026\nTEKNOLOGI REKAYASA INTERNET',
    },
    cornerRight: {
      en: 'FULL NAME\nUGM · VOCATIONAL SCHOOL',
      id: 'NAMA LENGKAP\nUGM · SEKOLAH VOKASI',
    },
    tagline: {
      en: 'stay *curious*,\nstay *connected*',
      id: 'tetap *penasaran*,\ntetap *terhubung*',
    },
    note: {
      en: "Hi! I'm a TRI student looking for an internship in internet & networking :)",
      id: 'Hai! Aku mahasiswa TRI yang lagi cari tempat magang di bidang internet & jaringan :)',
    },
    status: { en: 'Open to internship', id: 'Terbuka untuk magang' },
    thanks: {
      en: "Thanks for stopping by! I'm open to internship opportunities in internet & networking.",
      id: 'Terima kasih sudah mampir! Aku terbuka untuk kesempatan magang di bidang internet & jaringan.',
    },
    portrait,
    portraitAlt: {
      en: 'Placeholder portrait of the site owner',
      id: 'Foto potret pemilik situs (contoh)',
    },
    cv: { en: '/cv/cv-en.pdf', id: '/cv/cv-id.pdf' },
    links: {
      email: 'nama@example.com',
      linkedin: 'https://www.linkedin.com/in/namakamu',
      github: 'https://github.com/namakamu',
      whatsapp: '6281234567890',
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
      en: "I'm *Your Name*, an Internet Engineering Technology student who loves tinkering with networks.",
      id: 'Aku *Nama Kamu*, mahasiswa Teknologi Rekayasa Internet yang senang ngulik jaringan.',
    },
    intro: {
      en: 'Dummy text. Briefly tell who you are, why you are drawn to networking and the internet, and what kind of internship you are looking for.',
      id: 'Teks dummy. Ceritakan singkat siapa kamu, kenapa tertarik ke dunia jaringan dan internet, dan magang seperti apa yang sedang kamu cari.',
    },
    photo: portrait,
    photoAlt: {
      en: 'Placeholder photo of the site owner',
      id: 'Foto pemilik situs (contoh)',
    },
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
        label: { en: 'Semester', id: 'Semester' },
        value: { en: '5', id: '5' },
      },
      {
        label: { en: 'Based in', id: 'Domisili' },
        value: { en: 'Yogyakarta', id: 'Yogyakarta' },
      },
    ],
    skills: ['Mikrotik', 'Cisco Packet Tracer', 'Fiber Optic', 'Linux Server', 'HTML & CSS'],
    song: 'Judul Lagu Favorit',
  },

  study: {
    kicker: { en: '// study journey', id: '// perjalanan kuliah' },
    heading: {
      en: 'From *“what is an IP address?”* to building my own network.',
      id: 'Dari *“apa itu IP address?”* sampai merakit jaringan sendiri.',
    },
    items: [
      {
        when: { en: '2023 · Sem 1', id: '2023 · Sem 1' },
        title: { en: 'Started at TRI UGM', id: 'Masuk TRI UGM' },
        text: {
          en: 'Got to know the basics of computer networks and programming.',
          id: 'Kenalan dengan dasar jaringan komputer dan pemrograman.',
        },
      },
      {
        when: { en: '2024 · Sem 2', id: '2024 · Sem 2' },
        title: { en: 'First router', id: 'Router pertama' },
        text: {
          en: 'Learned subnetting and Mikrotik configuration.',
          id: 'Belajar subnetting dan konfigurasi Mikrotik.',
        },
      },
      {
        when: { en: '2024 · Sem 3', id: '2024 · Sem 3' },
        title: { en: 'Fiber optic practicum', id: 'Praktikum fiber optik' },
        text: {
          en: 'Splicing, OTDR testing and FTTH installation.',
          id: 'Splicing, uji OTDR, dan instalasi FTTH.',
        },
      },
      {
        when: { en: '2025 · Sem 4', id: '2025 · Sem 4' },
        title: { en: 'IoT project', id: 'Proyek IoT' },
        text: {
          en: 'Sensors and a simple monitoring dashboard.',
          id: 'Sensor dan dashboard monitoring sederhana.',
        },
      },
      {
        when: { en: '2025 · Sem 5', id: '2025 · Sem 5' },
        title: { en: 'Now', id: 'Sekarang' },
        text: {
          en: 'Looking for an internship in internet & networking.',
          id: 'Mencari magang di bidang internet & jaringan.',
        },
        current: true,
      },
    ],
  },

  work: {
    kicker: { en: '// what I do at uni', id: '// yang aku kerjakan di kuliah' },
    heading: {
      en: 'Practicums, projects, *and committees.*',
      id: 'Praktikum, proyek, *dan kepanitiaan.*',
    },
    items: [
      {
        category: 'practicum',
        title: {
          en: 'Configuring a small office network with Mikrotik',
          id: 'Konfigurasi jaringan kantor kecil dengan Mikrotik',
        },
        meta: { en: 'Networking Lab · 2024', id: 'Lab Jaringan · 2024' },
        details: {
          en: 'Dummy text. Describe the practicum: the task, the topology you built, the tools you used and what you learned.',
          id: 'Teks dummy. Jelaskan praktikumnya: tugasnya, topologi yang kamu bangun, alat yang dipakai, dan apa yang kamu pelajari.',
        },
        photo: work1,
        photoAlt: {
          en: 'Placeholder photo of the Mikrotik practicum',
          id: 'Foto praktikum Mikrotik (contoh)',
        },
        gallery: [
          {
            image: work1Extra1,
            alt: { en: 'Placeholder photo 2 of the practicum', id: 'Foto praktikum 2 (contoh)' },
          },
          {
            image: work1Extra2,
            alt: { en: 'Placeholder photo 3 of the practicum', id: 'Foto praktikum 3 (contoh)' },
          },
        ],
      },
      {
        category: 'project',
        title: {
          en: 'IoT-based server room temperature monitoring',
          id: 'Monitoring suhu ruang server berbasis IoT',
        },
        meta: { en: 'Course project · 2025', id: 'Tugas mata kuliah · 2025' },
        details: {
          en: 'Dummy text. Describe the project: the problem, the sensors and dashboard you built, and the result.',
          id: 'Teks dummy. Jelaskan proyeknya: masalahnya, sensor dan dashboard yang kamu buat, dan hasilnya.',
        },
        photo: work2,
        photoAlt: {
          en: 'Placeholder photo of the IoT project',
          id: 'Foto proyek IoT (contoh)',
        },
      },
      {
        category: 'organization',
        title: {
          en: 'IT division of a campus event committee',
          id: 'Divisi IT panitia acara kampus',
        },
        meta: { en: 'Committee · 2024', id: 'Panitia · 2024' },
        details: {
          en: 'Dummy text. Describe your role in the committee and what the IT division was responsible for.',
          id: 'Teks dummy. Jelaskan perananmu di kepanitiaan dan apa tanggung jawab divisi IT.',
        },
        photo: work3,
        photoAlt: {
          en: 'Placeholder photo of the campus event',
          id: 'Foto acara kampus (contoh)',
        },
      },
      {
        category: 'competition',
        title: {
          en: 'Network topology design competition',
          id: 'Lomba desain topologi jaringan',
        },
        meta: { en: 'Finalist · 2025', id: 'Finalis · 2025' },
        details: {
          en: 'Dummy text. Describe the competition, your team and the design you presented.',
          id: 'Teks dummy. Jelaskan lombanya, timmu, dan desain yang kamu presentasikan.',
        },
        photo: work4,
        photoAlt: {
          en: 'Placeholder photo of the competition',
          id: 'Foto lomba (contoh)',
        },
      },
    ],
  },

  certificates: {
    items: [
      {
        title: 'MTCNA',
        issuer: 'MikroTik',
        year: 2024,
        image: cert1,
        alt: { en: 'Placeholder scan of the MTCNA certificate', id: 'Pindaian sertifikat MTCNA (contoh)' },
        credentialUrl: 'https://example.com/credentials/mtcna',
      },
      {
        title: 'CCNA: Introduction to Networks',
        issuer: 'Cisco NetAcad',
        year: 2024,
        image: cert2,
        alt: {
          en: 'Placeholder scan of the CCNA certificate',
          id: 'Pindaian sertifikat CCNA (contoh)',
        },
        credentialUrl: 'https://example.com/credentials/ccna-itn',
      },
      {
        title: 'Fiber Optic Fundamentals',
        issuer: 'Example Training Institute',
        year: 2025,
        image: cert3,
        alt: {
          en: 'Placeholder scan of the fiber optic certificate',
          id: 'Pindaian sertifikat fiber optik (contoh)',
        },
      },
      {
        title: 'Network Competition: 2nd Place',
        issuer: 'Example Organizer',
        year: 2025,
        image: cert4,
        alt: {
          en: 'Placeholder scan of the competition certificate',
          id: 'Pindaian sertifikat lomba (contoh)',
        },
      },
    ],
  },
});
