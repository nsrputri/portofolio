# Portofolio Web

Situs portofolio satu halaman, dua bahasa (English sebagai bawaan, tombol `EN | ID` untuk Bahasa Indonesia). Dibuat dengan [Astro](https://astro.build). Folder About, Study, What I Do, dan Certificates terbuka satu per satu saat halaman di-scroll.

> **Sebagian isi masih contoh** (bagian What I Do, sertifikat 2–4, lagu di kaset, dan file CV). Isian dari pemilik dikumpulkan di `bahan/ISI-KONTEN.md` (folder itu tidak ikut ke GitHub). Baca bagian [Jangan deploy dulu](#7-jangan-deploy-dulu) sebelum mengunggah situs ke internet.

## 1. Persiapan

1. Node.js sudah terpasang di `C:\Program Files\nodejs`. Setelah memasang Node.js, **tutup lalu buka terminal baru** supaya perintah `node` dan `npm` dikenali (itu yang disebut PATH). Cek dengan `node -v`.
2. Di folder proyek, jalankan sekali: `npm install`.
3. Versinya minimal Node.js 22.22 (Astro 7 butuh itu). File `.node-version` (isinya `24`) memberi tahu Cloudflare versi Node yang dipakai saat build. Jangan dihapus.

## 2. Perintah sehari-hari

Jalankan di terminal, di dalam folder proyek.

| Perintah | Fungsinya |
| --- | --- |
| `npm run dev` | Menjalankan situs untuk dilihat sambil mengedit, di `http://localhost:4321`. Perubahan langsung terlihat. Hentikan dengan `Ctrl+C`. |
| `npm test` | Tes cepat untuk kode dan validasi isi (`src/data/schema.ts`). |
| `npx playwright test` | Tes di browser sungguhan (sama dengan `npm run test:e2e`). Ia membangun situs dan menjalankannya sendiri di port 4321, jadi **tutup dulu** `npm run dev` atau `npm run preview` yang masih jalan. Pertama kali mungkin perlu `npx playwright install chromium`. Lihat juga [Tes dan isi aslimu](#tes-dan-isi-aslimu). |
| `npm run build` | Memeriksa isi lalu membuat situs jadi di folder `dist/`. Kalau isi `content.ts` salah, di sini kamu akan tahu (lihat bagian 4). |
| `npm run preview` | Menjalankan hasil `build` seperti situs asli, di `http://localhost:4321`. |

## 3. Mengganti isi

**Semua teks ada di satu file: `src/data/content.ts`.** Setiap teks yang tampil di situs punya dua versi, `en` dan `id`, dan keduanya harus diisi:

```ts
status: { en: 'Open to internship', id: 'Terbuka untuk magang' },
```

Di tagline, label sudut cover, dan judul tiap bagian (`about.heading`, `study.heading`, `work.heading`), `*kata*` membuat kata itu miring dan `\n` membuat baris baru.

Hanya beberapa isian yang berupa teks biasa, bukan pasangan `{ en, id }`, karena tidak diterjemahkan: `site.name`, `site.stickerSub`, `title` dan `issuer` di setiap sertifikat, `about.skills` (daftar teks), dan `about.song`.

**Yang boleh dikosongkan** (hapus barisnya, tautan atau fotonya otomatis tidak muncul): `links.whatsapp` (angka saja dengan kode negara, tanpa `+`, spasi, atau `-`, misalnya `6281234567890`), `links.instagram` (alamat lengkap `https://instagram.com/...`), `coverPhoto` (foto latar cover; tanpa itu cover memakai gradasi), `cornerLeft` (label kecil di pojok kiri atas cover), `study.heading` (judul di atas timeline), dan `when` di tiap langkah timeline (tanggal yang belum diketahui).

**Tautan** LinkedIn, GitHub, Instagram, dan `credentialUrl` harus alamat lengkap yang diawali `https://`. Alamat `http://` atau `javascript:` ditolak saat build.

**Foto cover.** Teks putih di cover harus tetap terbaca di atas fotonya. Lapisan gelap di atas foto membantu, tetapi foto yang terang (langit putih, dinding cerah) bisa tetap gagal di tes `cover text meets WCAG AA contrast`. Pesan tesnya menyebut teks mana yang kurang kontras. Pilih foto yang lebih gelap atau lebih polos di bagian atas (tempat label pojok dan tagline), atau gelapkan lapisannya: di `src/components/Cover.astro`, naikkan angka `0.55`, `0.4`, dan `0.65` di aturan `.cover-bg::after` (misalnya jadi `0.65`, `0.55`, `0.75`).

**Foto.** Taruh foto aslimu di `src/assets/`, misalnya `src/assets/foto/aku.jpg`. Di bagian atas `content.ts`, `import` fotonya, lalu pakai nama import itu di tempat foto contoh tadi dipakai. Isi juga teks alt (`en` dan `id`) yang menjelaskan isi foto. Astro mengecilkan dan mengoptimalkan ukurannya sendiri. Yang terbit hanya salinan yang sudah dikecilkan; file aslinya (berikut data lokasi yang kadang tersimpan di foto HP) tidak ikut diunggah.

**Scan sertifikat.** Sama seperti foto: gambar scan-nya di `src/assets/`, lalu isi `image`. Kalau ada tautan kredensial online, isi `credentialUrl`. Kalau mau menyediakan PDF-nya, taruh di `public/certificates/nama.pdf` dan tulis `pdf: '/certificates/nama.pdf'`.

**CV.** Ganti dua file di `public/cv/`: `cv-en.pdf` (English) dan `cv-id.pdf` (Indonesia). Pakai nama file yang sama, maka `content.ts` tidak perlu diubah. Tombol Download CV otomatis memberi CV sesuai bahasa yang sedang dipilih.

Kalau CV-mu cuma satu, arahkan keduanya ke file yang sama, lalu hapus file yang tidak dipakai:

```ts
cv: { en: '/cv/cv.pdf', id: '/cv/cv.pdf' },
```

File CV dan PDF sertifikat harus benar-benar ada di `public/`, dengan nama yang persis sama, termasuk huruf besar-kecil (`CV.pdf` tidak sama dengan `cv.pdf`). Kalau tidak ada, build gagal (lihat bagian 4), jadi tombol Download CV tidak pernah mengarah ke file yang hilang.

> **Hati-hati dengan `npm run placeholders`.** Perintah itu hanya untuk membuat file contoh. Jangan dijalankan lagi setelah kamu memasang file asli: gambar di `src/assets/placeholders/` ditulis ulang setiap kali (jadi simpan foto aslimu dengan nama lain, seperti di atas). File CV yang sudah ada tidak akan ditimpa.

## 4. Kalau `npm run build` gagal

Isi `content.ts` diperiksa saat build. Kalau ada yang salah, pesannya seperti ini:

```
Invalid content:
- site.links.email: Invalid email address
- site.links.instgram: unknown key
- about.heading.id: Too small: expected string to have >=1 characters
```

Setiap baris berbentuk `- lokasi: pesan`. Lokasi menunjukkan letaknya di `content.ts`, dari luar ke dalam: `site.links.email` berarti bagian `site`, lalu `links`, lalu `email`. Angka di lokasi (misalnya `work.items.0.photo`) adalah urutan item yang dimulai dari 0, jadi `0` = item pertama.

- `unknown key`: nama itu tidak dikenal, biasanya salah ketik (di atas, `instgram` seharusnya `instagram`). Nama yang salah sengaja ditolak, bukan diabaikan diam-diam.
- `expected string, received undefined`: ada teks yang belum diisi, misalnya `en` ada tetapi `id` belum.
- `Too small ... >=1 characters`: teksnya kosong.
- `Invalid email address` atau `must match pattern`: format email, nomor WhatsApp, atau alamat CV/PDF salah.
- `file not found in public/ (looked for public/cv/CV-Kamu.pdf)`: alamat CV atau PDF sertifikat formatnya benar, tetapi filenya tidak ada di `public/`. Cek nama file dan huruf besar-kecilnya.
- `expected a full address starting with https://`: tautan LinkedIn, GitHub, Instagram, atau kredensial harus diawali `https://`.

**Salah ketik nama foto di baris `import`** memberi pesan yang bentuknya lain, karena muncul sebelum isinya diperiksa:

```
[UNRESOLVED_IMPORT] Could not resolve '../assets/foto/akuu.jpg' in src/data/content.ts
```

Artinya file di alamat itu tidak ditemukan. Cek nama folder dan file di `src/assets/` (huruf besar-kecil juga), serta `../` di depannya.

Kebalikannya, foto yang di-`import` tetapi tidak dipakai di mana pun (misalnya setelah satu sertifikat dihapus) juga menggagalkan build, dengan pesan seperti `src/data/content.ts:14:1 - error ts(6133): 'cert4' is declared but its value is never read.` Hapus baris `import` itu. Foto seperti itu akan ikut terbit dalam ukuran asli, jadi build sengaja menolaknya.

### Tes dan isi aslimu

Tes tidak lagi mengecek teks contoh. Tes membaca isi `content.ts` dan membandingkan halaman dengan isi itu, jadi tes tetap lulus setelah isinya kamu ganti. Yang masih bisa gagal karena isimu, dan memang sebaiknya diperbaiki:

- **Tes kontras cover**, kalau foto cover terlalu terang (lihat "Foto cover" di bagian 3).
- **Tes layar pertama** (`all four closed tabs fit the first screen`, `every closed tab is fully inside the viewport`, `polaroid and note stay clear of the tagline`), kalau tagline atau catatan di kertas terlalu panjang. Tagline paling pas dua baris pendek, seperti contohnya.
- Tes `credential link is localized` dilewati (*skipped*), bukan gagal, kalau tidak ada sertifikat yang punya `credentialUrl`.

## 5. Gambar pratinjau (`public/og.png`)

Ini gambar yang muncul saat tautan situsmu dibagikan di WhatsApp, LinkedIn, dan sejenisnya: tangkapan layar cover beserta tumpukan folder yang tertutup. Buat ulang setiap kali cover berubah (tagline, foto, warna):

1. Terminal 1: `npm run build`, lalu `npm run preview`. Biarkan tetap jalan.
2. Terminal 2: `npm run og`.
3. Hentikan `npm run preview` dengan `Ctrl+C`, lalu simpan `public/og.png` yang baru ke git.

Ukuran filenya dijaga di bawah 300 KB, karena WhatsApp membuang gambar pratinjau yang lebih besar. Kalau cover-nya terlalu rumit (misalnya foto besar yang sangat detail), `npm run og` berhenti dengan pesan dan fotonya perlu dibuat lebih sederhana.

## 6. Alamat situs

Kalau alamat aslinya sudah diketahui, ubah `site` di `astro.config.mjs`, misalnya `site: 'https://namaku.pages.dev'`. Alamat itu dipakai untuk tautan kanonik, alamat gambar pratinjau, dan tulisan alamat di footer.

Alamat yang tidak ada di situsmu (misalnya tautan yang salah ketik) menampilkan halaman `public/404.html` dengan tautan kembali ke beranda, bukan halaman utama.

## 7. Jangan deploy dulu

Jangan unggah situs ke internet sebelum isi aslinya masuk semua. Sebagai pengaman, build di Cloudflare berhenti dengan pesan `Not deploying the dummy content: src/data/content.ts still has placeholder text at ...` selama masih ada teks contoh di `content.ts` (misalnya "Teks dummy", "(contoh)", `example.com`, atau "Judul Lagu Favorit"). Pesannya menyebut letak setiap teks contoh yang tersisa. Build di komputermu sendiri tidak terpengaruh. Daftar periksa:

- [ ] Nama, teks, dan semua pasangan `en` / `id` di `src/data/content.ts` sudah asli.
- [ ] Email, LinkedIn, GitHub (dan WhatsApp / Instagram kalau dipakai) sudah milikmu.
- [ ] Foto sudah diganti, termasuk teks alt-nya.
- [ ] Sertifikat dan proyek sudah asli.
- [ ] `public/cv/cv-en.pdf` dan `cv-id.pdf` sudah CV asli.
- [ ] `site` di `astro.config.mjs` sudah alamat yang benar.
- [ ] `public/og.png` sudah dibuat ulang dengan cover yang asli.
- [ ] `npm test`, `npm run build`, dan `npx playwright test` lulus. Tes tidak perlu diubah untuk isi aslimu (lihat [Tes dan isi aslimu](#tes-dan-isi-aslimu)).
