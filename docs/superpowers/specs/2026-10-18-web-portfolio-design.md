# Desain Web Portfolio — "Folder Pastel"

Tanggal: 2026-10-18
Status: draf, menunggu persetujuan

Penanda di dokumen ini:
- **(keputusan Claude)**: dipilih Claude, belum dikonfirmasi pemilik. Boleh dikoreksi.
- Poin tanpa penanda sudah diputuskan atau disetujui pemilik dalam diskusi.

---

## 1. Maksud dan alasan

Pemilik web adalah mahasiswa **Teknologi Rekayasa Internet (TRI), DTEDI, Sekolah Vokasi UGM** yang sedang **mencari magang**. Targetnya **ICONNET (PLN Icon Plus)** atau perusahaan sejenis di bidang internet, jaringan, dan ISP.

Pembaca utama web ini adalah **recruiter magang**. Setelah melihat web ini, recruiter harus mendapat kesan bahwa pemiliknya:
- **fun dan kreatif, tapi tetap clean dan rapi**,
- **aktif dan punya banyak kegiatan**,
- punya bekal teknis yang relevan untuk dunia jaringan dan internet.

Web ini juga sekaligus bukti skill. Pemilik harus bisa menjelaskan cara web ini dibuat saat interview, dan bisa memperbarui isinya sendiri.

## 2. Tujuan, bukan tujuan, dan anti-tujuan

**Tujuan**
- Info penting langsung terlihat di layar pertama, tanpa scroll: nama, jurusan dan kampus, status "open to internship", dan tombol **Download CV**.
- Empat bagian isi: **About Me**, **Study Journey**, **What I Do** (kegiatan selama kuliah), dan **Sertifikat**.
- Bukti skill jaringan (praktikum, proyek, sertifikasi) mudah ditemukan.
- Nyaman dibuka di HP, karena link portfolio sering dibuka recruiter dari email, WhatsApp, atau LinkedIn.
- Dua bahasa: Inggris (default) dan Indonesia.
- Isi gampang diganti tanpa menyentuh desain.

**Bukan tujuan**
- Panel admin atau CMS, blog, formulir kontak dengan backend, atau banyak halaman.
- Mode gelap **(keputusan Claude)**: gaya kertas pastel akan kehilangan karakternya kalau dibalik gelap.

**Anti-tujuan** (tetap dianggap gagal walaupun web-nya berfungsi)
- Kesannya terlalu main-main sampai recruiter korporat ragu.
- Terlalu ramai, sehingga info penting susah ditemukan.
- Scroll dibajak animasi (opsi C sudah ditolak karena ini), sehingga recruiter tidak bisa skimming dengan cepat.
- Lambat atau berat di HP.

## 3. Arah visual

Referensi utama ada dua gambar dari pemilik:
- **Foto 1 (gaya keseluruhan):** kolase di atas foto suasana. Lembaran folder warna pastel bertumpuk, masing-masing punya tab label huruf monospace. Ada polaroid dengan pin, kertas catatan dengan paperclip dan tulisan tangan, doodle bunga putih, kaset, klip binder, stiker barcode bertuliskan nama, dan judul besar serif yang sebagian italic.
- **Foto 2 (khusus folder Sertifikat):** papan biru bergaris grid. Kartu kertas sobekan dari buku spiral (ada lubang spiral di sisi kiri) dijepit klip pink di atasnya, bernomor 01, 02, dan seterusnya, berisi gambar kecil, judul, dan keterangan.

**Mockup acuan:** `.superpowers/brainstorm/mockups/opsi-b.html`, yang disajikan oleh `.superpowers/brainstorm/serve.py`. Mockup ini **acuan resmi untuk tata letak dan gerak** (sudah disetujui pemilik). Detail visualnya masih kasar dan boleh dipoles, tapi karakternya harus tetap sama.

**Warna folder** (dari pemilik), dengan tab berselang kiri-kanan seperti foto 1:

| # | Folder | Warna | Posisi tab |
|---|---|---|---|
| 01 | About Me | pink | kiri |
| 02 | Study Journey | krem | kanan |
| 03 | What I Do | biru keabuan | kiri |
| 04 | Sertifikat | kuning muda soft, berisi papan biru grid ala foto 2 | kanan |

Nilai warna di mockup (`shared.css`) bisa jadi titik awal: pink `#e8c8c2`, krem `#dad3c3`, biru `#bccad5`, kuning `#f1e6b9`, papan `#2f6fe0`, klip `#ee5ea9`.

**Huruf** (mengikuti mockup, boleh disetel) **(keputusan Claude)**: Instrument Serif untuk judul, DM Mono untuk label dan tab, Caveat untuk tulisan tangan, DM Sans untuk teks isi, dan Silkscreen (huruf piksel) khusus judul papan sertifikat.

## 4. Struktur halaman

Satu halaman panjang **(keputusan Claude)** dengan urutan berikut.

### 4.1 Cover (layar pertama)
- Foto latar suasana. Pemilik akan menyediakannya; selama belum ada, pakai gradien seperti di mockup. Beri lapisan gelap tipis supaya teks putih tetap terbaca.
- Label kecil monospace di dua pojok atas, misalnya "PORTFOLIO 2026 / TEKNOLOGI REKAYASA INTERNET" di kiri dan nama serta "UGM · SEKOLAH VOKASI" di kanan.
- Tagline besar bergaya serif. Isinya sementara "stay curious, stay connected", nanti diganti pemilik.
- Hiasan: doodle bunga, polaroid foto pemilik dengan pin, dan kertas catatan berpaperclip berisi sapaan tulisan tangan. Di HP, polaroid dan catatan boleh disembunyikan supaya cover tetap lega (seperti di mockup).
- Baris identitas: stiker barcode bertuliskan nama, tombol **Download CV**, dan label "Open to internship".
- Di bagian bawah cover, keempat folder bertumpuk dalam keadaan tertutup. Yang terlihat hanya tab dan sedikit badan folder, dengan selembar kertas putih menyembul di sisi yang berlawanan dengan tab.

### 4.2 Folder 01 — About Me
Polaroid foto pemilik, judul perkenalan, paragraf singkat, fakta singkat (kampus, jurusan, semester, domisili), chip skill, dan kaset hiasan berlabel "now playing" dengan lagu favorit.

### 4.3 Folder 02 — Study Journey
Timeline per semester dalam bentuk kartu kertas yang sedikit miring. Tiap kartu berisi waktu (tulisan tangan merah), judul, dan deskripsi pendek. Kartu terakhir ("sekarang") diberi sorotan garis putus-putus.

### 4.4 Folder 03 — What I Do
Kartu kegiatan bergaya polaroid. Tiap kartu berisi foto, tag kategori (Praktikum, Proyek, Organisasi, Lomba), judul, serta peran atau tempat dan tahun. Ada hiasan klip binder di tepi atas folder.
- Klik kartu membuka **popup detail** berisi deskripsi lebih panjang dan beberapa foto tambahan. Pemilik tidak keberatan dengan ini saat ditawarkan.

### 4.5 Folder 04 — Sertifikat
Papan biru grid (foto 2) dengan judul huruf piksel "CERTIFICATES >>>>". Kartu kertas sobekan bernomor, dijepit klip pink, masing-masing berisi gambar kecil sertifikat, judul, dan penerbit serta tahun.
- Klik kartu membuka **popup berisi scan sertifikat ukuran penuh**, supaya recruiter bisa memeriksanya. Kalau ada, sertakan juga link kredensial atau link ke PDF aslinya.
- Format file **(keputusan Claude)**: sertifikat disimpan sebagai gambar (JPG/PNG) untuk gambar kecil dan popup. Sertifikat yang hanya ada dalam PDF diubah dulu ke gambar, dan PDF-nya boleh tetap ditautkan.

### 4.6 Penutup
Stiker barcode bertuliskan nama, alamat web, kalimat terima kasih, dan link Email, LinkedIn, GitHub, serta Download CV.
- Data juga menyediakan kolom opsional WhatsApp dan Instagram. Link hanya tampil kalau kolomnya diisi **(keputusan Claude)**: recruiter di Indonesia sering menghubungi lewat WhatsApp.

## 5. Gerak (opsi B "Mekar", sudah disetujui)

Perilaku harus sama seperti `opsi-b.html`:

1. **Saat halaman dibuka:** keempat folder tertutup dan bertumpuk di bawah cover. Folder yang tertutup sedikit lebih sempit dari layar (menjorok sekitar 3,5vw di kiri dan kanan), dan isinya disembunyikan.
2. **Scroll ke bawah:** folder terbuka **satu per satu, sesuai urutan**. Sebuah folder terbuka ketika tepi atasnya naik melewati sebuah garis di layar, kira-kira 42% dari atas. Garis ini selalu berada sedikit di atas posisi awal About Me, supaya tumpukan tidak pernah terbuka sendiri saat halaman dibuka. Saat terbuka, folder melebar sampai tepi layar, tingginya bertambah sampai seluruh isinya terlihat, isinya muncul perlahan, lalu foto dan kartu "jatuh" ke tempatnya dengan sedikit pantulan.
3. **Scroll ke atas:** folder **menutup lagi dengan urutan terbalik**. Folder terakhir yang terbuka menutup ketika tepi atasnya turun melewati garis tadi plus jarak kira-kira 48px. Jarak ini mencegah folder berkedip buka-tutup kalau scroll berhenti tepat di garis. Saat kembali ke paling atas, semua folder bertumpuk tertutup lagi.
4. **Klik tab folder:** folder itu dan semua folder di atasnya langsung terbuka, lalu halaman bergeser halus ke folder tersebut. Buka-tutup otomatis ditahan sampai pergeseran selesai.
5. **Mode "kurangi animasi"** (`prefers-reduced-motion`) **(keputusan Claude)**: semua folder langsung tampil terbuka, tanpa animasi dan tanpa buka-tutup.
6. Folder yang sedang terbuka harus memberi ruang di bagian bawahnya, supaya tab folder berikutnya tidak menutupi isi.
7. Tidak ada scroll yang dikunci (*pinning*) atau dibajak. Scroll selalu terasa normal.

Animasi memakai **GSAP**. Di mockup, logika buka-tutup ditulis sendiri lewat event scroll, bukan ScrollTrigger, karena tinggi folder berubah-ubah. Cara implementasinya diserahkan ke builder, asalkan perilakunya sama.

## 6. Dua bahasa

- **Bahasa Inggris adalah default.** Ada tombol **EN | ID** untuk ganti ke bahasa Indonesia.
- Tombol menempel di pojok kanan atas dan selalu terlihat saat scroll **(keputusan Claude)**.
- Pergantian bahasa terjadi seketika **tanpa memuat ulang halaman**, dan tidak mengubah posisi scroll atau folder yang sedang terbuka **(keputusan Claude)**.
- Pilihan bahasa diingat di browser pengunjung, dan atribut `lang` pada halaman ikut berubah **(keputusan Claude)**. Tidak ada deteksi otomatis bahasa browser, jadi pengunjung baru selalu mendapat bahasa Inggris.
- Setiap teks di data (termasuk teks alternatif gambar) punya dua versi, `en` dan `id`. Data dummy juga dibuat dalam dua bahasa.
- Tombol Download CV mengikuti bahasa yang dipilih kalau tersedia CV versi Inggris dan Indonesia. Kalau hanya ada satu, keduanya memakai file yang sama **(keputusan Claude)**.
- Label hiasan yang memang bagian dari gaya visual, seperti "CERTIFICATES >>>>" dan "now playing", boleh tetap berbahasa Inggris di kedua mode.

## 7. Isi dan data

- **Semua isi berada di satu tempat** (satu file data atau satu set data yang jelas), terpisah dari kode tampilan: teks, daftar timeline, kegiatan, sertifikat, link, path foto, dan path CV.
- Data **divalidasi saat build**. Kalau ada kolom wajib yang kosong, salah ketik, atau gambar yang tidak ditemukan, build gagal dengan pesan yang jelas. Ini sudah dijanjikan ke pemilik.
- Menambah sertifikat atau kegiatan baru cukup dengan menambah satu entri dan satu gambar, tanpa mengubah desain.
- Untuk sekarang, semua isi memakai **data dummy** yang realistis untuk anak TRI (contoh seperti di mockup: MTCNA, CCNA ITN, praktikum fiber optik, proyek IoT). Isi asli menyusul dari pemilik.
- Harus ada catatan singkat (misalnya README) yang menjelaskan cara mengganti isi dan foto, ditulis untuk pemilik yang baru belajar.

## 8. Teknologi dan hosting

- **Astro** (versi stabil terbaru), **tanpa React**. Kalau nanti butuh bagian interaktif yang rumit, boleh ditambahkan sebagai island, tapi saat ini tidak diperlukan.
- **GSAP** untuk animasi folder dan isinya.
- **Optimasi gambar bawaan Astro** (resize dan WebP/AVIF) untuk semua foto dan scan sertifikat. Gambar di bawah layar pertama dimuat belakangan (*lazy load*).
- Font di-host sendiri, tidak memanggil Google Fonts saat runtime **(keputusan Claude)**: lebih cepat dan tanpa permintaan ke pihak ketiga.
- Hasil build berupa **HTML statis**.
- **Hosting di Cloudflare** (Pages, atau Workers static assets kalau itu yang disarankan Cloudflare saat setup), deploy otomatis dari repo GitHub. Alamat awal memakai subdomain gratis seperti `namakamu.pages.dev`. Domain sendiri bisa menyusul **(keputusan Claude)**.
- **Cloudflare Web Analytics** (gratis, tanpa cookie) untuk melihat apakah link portfolio dibuka **(keputusan Claude)**.
- **Urutan rilis (dari pemilik):** bangun dulu dengan data dummy, lalu isi data asli, **baru setelah itu deploy ke Cloudflare**. Jangan deploy saat isinya masih dummy.

## 9. Kualitas

- **HP:** nyaman dipakai mulai lebar layar sekitar 360px. Tidak ada scroll ke samping, dan teks di HP tidak terlalu kecil.
- **Performa (keputusan Claude):** target skor Lighthouse mobile untuk Performance minimal 90, dengan JavaScript sesedikit mungkin.
- **Aksesibilitas:** tab folder, kartu, popup, dan tombol bahasa bisa dipakai lewat keyboard dan punya fokus yang terlihat. Popup bisa ditutup dengan tombol Esc. Semua foto punya teks alternatif dalam dua bahasa. Kontras teks di atas foto cover cukup.
- **Pratinjau link (keputusan Claude):** isi title, description, dan gambar Open Graph, supaya link yang dikirim lewat WhatsApp atau LinkedIn tampil sebagai kartu pratinjau yang rapi.

## 10. Kondisi saat ini dan batasan

- Folder project: `D:\_Web-porto` (Windows). Belum menjadi repo git.
- **Node.js belum terpasang** dan wajib diinstal (versi LTS) sebelum build dimulai. Pemasangannya, entah lewat `winget` atau installer resmi, harus disetujui pemilik terlebih dahulu. Git dan Python 3.11 sudah ada.
- Pemilik masih belajar, jadi struktur kode harus sederhana, mudah dijelaskan saat interview, dan mudah diedit sendiri.
- Biaya: semua harus gratis.
- Folder `.superpowers/` berisi mockup dan server mockup. Folder ini tidak ikut di-commit, jadi tambahkan ke `.gitignore`.

## 11. Diserahkan ke builder

- Struktur folder, pembagian komponen, dan cara menyimpan data (asal memenuhi bagian 7).
- Cara implementasi logika buka-tutup dan pergantian bahasa (asal perilakunya sesuai bagian 5 dan 6).
- Detail polesan visual: bayangan, kemiringan kartu, tekstur kertas, spasi, dan ukuran huruf, selama tetap setia pada foto 1, foto 2, dan mockup.
- Pendekatan pengujian.
- Bentuk dan perilaku popup (lightbox).

## 12. Isi yang nanti disediakan pemilik

Nama lengkap, foto diri, foto latar cover, tagline, sapaan di kertas catatan, teks perkenalan, fakta singkat, daftar skill, lagu favorit (untuk kaset), timeline per semester, daftar kegiatan beserta foto, daftar sertifikat beserta scan-nya, file CV (versi Inggris dan/atau Indonesia), serta link email, LinkedIn, dan GitHub. Semua teks dalam dua bahasa.
