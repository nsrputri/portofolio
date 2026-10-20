// All user-visible content lives here and is validated at build time by schema.ts.
// Filled in from bahan/ISI-KONTEN.md. What is still DUMMY (marked "Teks dummy", "(contoh)",
// example.com and the placeholder images) waits for the owner's answers; a Cloudflare build refuses
// to run until none is left (src/data/deploy-guard.ts).
// `*word*` renders as emphasis, `\n` as a line break (see src/lib/rich.ts).
import portrait from '../assets/foto/nisrina-potret.jpg';
import coverPhoto from '../assets/foto/latar-cover.jpg';
import certFiberOptik from '../assets/sertifikat/fiber-optik-bnsp.png';
import work1 from '../assets/placeholders/work-1.jpg';
import work1Extra1 from '../assets/placeholders/work-1-extra-1.jpg';
import work1Extra2 from '../assets/placeholders/work-1-extra-2.jpg';
import work2 from '../assets/placeholders/work-2.jpg';
import work3 from '../assets/placeholders/work-3.jpg';
import work4 from '../assets/placeholders/work-4.jpg';
import cert2 from '../assets/placeholders/cert-2.jpg';
import cert3 from '../assets/placeholders/cert-3.jpg';
import cert4 from '../assets/placeholders/cert-4.jpg';
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
    cv: { en: '/cv/cv-en.pdf', id: '/cv/cv-id.pdf' },
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
    song: 'Judul Lagu Favorit',
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
        title: 'Training Fiber Optik Bersertifikasi BNSP',
        issuer: 'LPK Pasopati',
        year: 2026,
        image: certFiberOptik,
        alt: {
          en: 'Certificate from LPK Pasopati for the BNSP-certified Fiber Optic Training, 11–13 March 2026, awarded to Nisrina Putri Fatimah Azzahra',
          id: 'Sertifikat LPK Pasopati untuk Training Fiber Optik Bersertifikasi BNSP, 11–13 Maret 2026, atas nama Nisrina Putri Fatimah Azzahra',
        },
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
