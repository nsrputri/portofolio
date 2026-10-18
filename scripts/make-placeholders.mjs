// Generates the dummy assets the site ships with until real content replaces them:
//   src/assets/placeholders/*.jpg   labelled placeholder photos and certificate scans
//   public/cv/cv-en.pdf, cv-id.pdf  minimal one-page PDFs, only when the file is missing
// Run with `npm run placeholders`. Output is committed. The CV PDFs are never overwritten, so the real
// ones survive a re-run; the images are rewritten every time, so keep real photos under other names.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = join(root, 'src', 'assets', 'placeholders');
const cvDir = join(root, 'public', 'cv');

const FONT = "'DM Mono', 'Courier New', monospace";

function svg({ width, height, label, sub, from, to }) {
  const fontSize = Math.round(width * 0.05);
  const subSize = Math.round(width * 0.026);
  const inset = Math.round(width * 0.04);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="3" stroke-dasharray="14 10"/>
  <path d="M${inset} ${inset}L${width - inset} ${height - inset}M${width - inset} ${inset}L${inset} ${height - inset}" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>
  <text x="50%" y="50%" text-anchor="middle" font-family="${FONT}" font-size="${fontSize}" letter-spacing="${Math.round(fontSize * 0.12)}" fill="rgba(0,0,0,0.55)">${label}</text>
  <text x="50%" y="${Math.round(height * 0.5 + fontSize * 1.3)}" text-anchor="middle" font-family="${FONT}" font-size="${subSize}" letter-spacing="${Math.round(subSize * 0.1)}" fill="rgba(0,0,0,0.4)">${sub ?? `${width} x ${height}`}</text>
</svg>`;
}

const PHOTO = { from: '#ddd7cc', to: '#bcb3a5' };
const SCAN = { from: '#fbf9f5', to: '#e9e2d2' };

const images = [
  { file: 'portrait.jpg', width: 800, height: 1000, label: 'FOTO KAMU', ...PHOTO },
  ...[1, 2, 3, 4].map((n) => ({
    file: `work-${n}.jpg`,
    width: 1200,
    height: 900,
    label: `FOTO KEGIATAN ${n}`,
    ...PHOTO,
  })),
  ...[1, 2].map((n) => ({
    file: `work-1-extra-${n}.jpg`,
    width: 1200,
    height: 900,
    label: `FOTO KEGIATAN 1 / ${n + 1}`,
    ...PHOTO,
  })),
  ...[1, 2, 3, 4].map((n) => ({
    file: `cert-${n}.jpg`,
    width: 1400,
    height: 1000,
    label: `SCAN SERTIFIKAT ${n}`,
    ...SCAN,
  })),
];

// Minimal valid single-page PDF (Helvetica, one line of text). Offsets in the
// xref table are computed from the real byte positions.
function minimalPdf(text) {
  const stream = `BT /F1 28 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

await mkdir(imageDir, { recursive: true });
await mkdir(cvDir, { recursive: true });

for (const { file, ...spec } of images) {
  await sharp(Buffer.from(svg(spec)))
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(join(imageDir, file));
}

const cvs = [
  { file: 'cv-en.pdf', text: 'Placeholder CV (English) - replace me' },
  { file: 'cv-id.pdf', text: 'CV contoh (Indonesia) - ganti aku' },
];
let wrotePdfs = 0;
for (const { file, text } of cvs) {
  const path = join(cvDir, file);
  if (existsSync(path)) {
    console.log(`Kept public/cv/${file}: it already exists, so it was not overwritten`);
    continue;
  }
  await writeFile(path, minimalPdf(text));
  wrotePdfs++;
}

console.log(`Wrote ${images.length} images to src/assets/placeholders; new PDFs in public/cv: ${wrotePdfs}`);
