# Portofolio Web

Situs portofolio satu halaman, dua bahasa (English sebagai bawaan, tombol `EN | ID` untuk Bahasa Indonesia). Dibuat dengan [Astro](https://astro.build). Folder About, Study, What I Do, dan Certificates terbuka satu per satu saat halaman di-scroll.

> **Saat ini semua isinya masih contoh** (nama `NAMA KAMU`, foto kotak abu-abu, CV dan sertifikat palsu). Baca bagian [Jangan deploy dulu](#7-jangan-deploy-dulu) sebelum mengunggah situs ke internet.

## 1. Persiapan

1. Node.js sudah terpasang di `C:\Program Files\nodejs`. Setelah memasang Node.js, **tutup lalu buka terminal baru** supaya perintah `node` dan `npm` dikenali (itu yang disebut PATH). Cek dengan `node -v`.
2. Di folder proyek, jalankan sekali: `npm install`.

## 2. Perintah sehari-hari

Jalankan di terminal, di dalam folder proyek.

| Perintah | Fungsinya |
| --- | --- |
| `npm run dev` | Menjalankan situs untuk dilihat sambil mengedit, di `http://localhost:4321`. Perubahan langsung terlihat. Hentikan dengan `Ctrl+C`. |
| `npm test` | Tes cepat untuk kode dan validasi isi (`src/data/schema.ts`). |
| `npx playwright test` | Tes di browser sungguhan (sama dengan `npm run test:e2e`). Ia membangun situs dan menjalankannya sendiri di port 4321, jadi **tutup dulu** `npm run dev` atau `npm run preview` yang masih jalan. Pertama kali mungkin perlu `npx playwright install chromium`. |
| `npm run build` | Memeriksa isi lalu membuat situs jadi di folder `dist/`. Kalau isi `content.ts` salah, di sini kamu akan tahu (lihat bagian 4). |
| `npm run preview` | Menjalankan hasil `build` seperti situs asli, di `http://localhost:4321`. |

## 3. Mengganti isi

**Semua teks ada di satu file: `src/data/content.ts`.** Setiap teks yang tampil di situs punya dua versi, `en` dan `id`, dan keduanya harus diisi:

```ts
status: { en: 'Open to internship', id: 'Terbuka untuk magang' },
```

Di tagline dan label sudut cover, `*kata*` membuat kata itu miring dan `\n` membuat baris baru.

**Yang boleh dikosongkan** (hapus barisnya, tautan atau fotonya otomatis tidak muncul): `links.whatsapp` (angka saja dengan kode negara, tanpa `+`, spasi, atau `-`, misalnya `6281234567890`), `links.instagram` (alamat lengkap `https://instagram.com/...`), dan `coverPhoto` (foto latar cover; tanpa itu cover memakai gradasi).

**Foto.** Taruh foto aslimu di `src/assets/`, misalnya `src/assets/foto/aku.jpg`. Di bagian atas `content.ts`, `import` fotonya, lalu pakai nama import itu di tempat foto contoh tadi dipakai. Isi juga teks alt (`en` dan `id`) yang menjelaskan isi foto. Astro mengecilkan dan mengoptimalkan ukurannya sendiri.

**Scan sertifikat.** Sama seperti foto: gambar scan-nya di `src/assets/`, lalu isi `image`. Kalau ada tautan kredensial online, isi `credentialUrl`. Kalau mau menyediakan PDF-nya, taruh di `public/certificates/nama.pdf` dan tulis `pdf: '/certificates/nama.pdf'`.

**CV.** Ganti dua file di `public/cv/`: `cv-en.pdf` (English) dan `cv-id.pdf` (Indonesia). Pakai nama file yang sama, maka `content.ts` tidak perlu diubah. Tombol Download CV otomatis memberi CV sesuai bahasa yang sedang dipilih.

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

## 5. Gambar pratinjau (`public/og.png`)

Ini gambar yang muncul saat tautan situsmu dibagikan di WhatsApp, LinkedIn, dan sejenisnya: tangkapan layar cover beserta tumpukan folder yang tertutup. Buat ulang setiap kali cover berubah (tagline, foto, warna):

1. Terminal 1: `npm run build`, lalu `npm run preview`. Biarkan tetap jalan.
2. Terminal 2: `npm run og`.
3. Hentikan `npm run preview` dengan `Ctrl+C`, lalu simpan `public/og.png` yang baru ke git.

## 6. Alamat situs

Kalau alamat aslinya sudah diketahui, ubah `site` di `astro.config.mjs`, misalnya `site: 'https://namaku.pages.dev'`. Alamat itu dipakai untuk tautan kanonik, alamat gambar pratinjau, dan tulisan alamat di footer.

## 7. Jangan deploy dulu

Jangan unggah situs ke internet sebelum isi aslinya masuk semua. Daftar periksa:

- [ ] Nama, teks, dan semua pasangan `en` / `id` di `src/data/content.ts` sudah asli.
- [ ] Email, LinkedIn, GitHub (dan WhatsApp / Instagram kalau dipakai) sudah milikmu.
- [ ] Foto sudah diganti, termasuk teks alt-nya.
- [ ] Sertifikat dan proyek sudah asli.
- [ ] `public/cv/cv-en.pdf` dan `cv-id.pdf` sudah CV asli.
- [ ] `site` di `astro.config.mjs` sudah alamat yang benar.
- [ ] `public/og.png` sudah dibuat ulang dengan cover yang asli.
- [ ] `npm run build` dan `npx playwright test` lulus. Sebagian tes mengecek teks contoh (misalnya `NAMA KAMU`), jadi tes itu perlu disesuaikan dengan isi aslimu.
