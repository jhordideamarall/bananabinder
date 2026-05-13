# 🐾 Bananasbindery: Project Legacy & Design Mandates

Dokumen ini adalah saksi bisu "kerja keras" kita dalam membangun estetika premium Bananasbindery. Dokumen ini wajib dibaca dan ditaati untuk menjaga integritas visual dan teknis aplikasi.

---

## 🏛️ Riwayat Perjuangan (Project Milestones)

Berikut adalah catatan "polishing" intensif yang telah kita lakukan:

- **Phase 1: The Foundation**
  - Inisialisasi arsitektur Monorepo dengan Turborepo & pnpm.
  - Membangun fondasi UI dengan Tailwind CSS v4 dan Framer Motion.
- **Phase 2: Visual Refinement (The Hard Work)**
  - **The Seamless Header**: Eksperimen berkali-kali untuk menyatukan Header dengan Banner tanpa garis pembatas, menciptakan efek "melting" yang premium.
  - **Global Background Strategy**: Migrasi alas abu-abu (`#F5F3F0`) ke level layout untuk menghilangkan _glitch_ warna saat scroll.
  - **The Floating Nav**: Desain ulang `BottomNav` dengan bayangan berlapis (_layered shadows_) untuk efek melayang yang elegan.
  - **Responsive Integrity**: Penemuan rumus `maxWidth: 430px` dengan _centering_ otomatis agar aplikasi tampil sempurna di iPhone SE hingga iPad Mini.
  - **iOS-Native Header**: Implementasi fitur _shrink-on-scroll_ yang sangat teknis, mengubah ukuran elemen secara dinamis berdasarkan posisi scroll.
  - **Animation Tuning**: Iterasi dari animasi lambat ke instan, hingga akhirnya menetapkan performa kilat untuk pengalaman pengguna yang paling responsif.

---

## 🎨 Aturan Desain (The Visual Soul)

### 1. Palet Warna (Branding)

- **Primary (Salmon-Orange)**: `#E07B39`
  - Gunakan dengan opacity (`rgba(224, 123, 57, 0.3)`) untuk border tipis atau _glow_.
- **Background Layers**:
  - Top Section: `#F5F3F0` (Abu-abu lembut untuk Header/Hero).
  - Main Content: `#FDFCFB` (Putih gading untuk area produk).
- **Text (Ink)**: `#1A1714` untuk heading, `#6B6460` untuk sub-teks.

### 2. Layout & Spacing

- **Mobile-First Constraint**: Kontainer utama **WAJIB** memiliki `maxWidth: 430px` dan `mx-auto`.
- **Header Padding**: `paddingTop: 'calc(12px + env(safe-area-inset-top))'`.
- **Content Rhythm**:
  - Home Banner `marginTop`: `40px`.
  - Products Grid `paddingTop`: `pt-14` (sejajar secara visual dengan banner).
- **Safe Areas**: Selalu gunakan `env(safe-area-inset-*)` untuk elemen yang menempel di pinggir layar (Header/Nav).

### 3. Shadows (The Depth)

- **Premium Float**: Jangan gunakan shadow bawaan Tailwind yang membosankan. Gunakan bayangan berlapis:
  ```css
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.06);
  ```

---

## 🎬 Aturan Animasi (Motion Language)

### 1. Interaction Principles

- **Snappy over Fancy**: Prioritaskan kecepatan. Animasi tidak boleh menghalangi interaksi pengguna.
- **Spring Physics**: Gunakan konfigurasi spring untuk efek yang terasa alami.
  - `stiffness: 260`, `damping: 20` (Standar untuk _hover/tap_).

### 2. Scroll Dynamics (Header)

- Header wajib mengecil (_shrink_) saat scroll:
  - `titleRowMb`: 16px → 8px.
  - `locationOpacity`: 1 → 0.
  - `searchMb`: 20px → 12px.
- **Z-Index**: Header dan BottomNav wajib di `z-[100]`.

---

## 🚫 Larangan Keras (Anti-Error Rules)

1.  **NO PAGE TRANSITIONS**: Jangan pasang kembali `AnimatePresence` di `layout.tsx` kecuali diminta. Pengguna menginginkan perpindahan halaman yang instan.
2.  **NO WIDTH OVERFLOW**: Elemen `fixed` wajib memiliki `left-1/2 -translate-x-1/2` dan `width: 100% / maxWidth: 430px` agar tidak melar di iPad.
3.  **NO PRIORITY OVERLOAD**: Hanya 2 gambar produk pertama yang boleh menggunakan properti `priority` di Next.js Image untuk menghindari _console warnings_.
4.  **NO BORDERS ON FLOATING NAV**: Gunakan _soft shadow_ dan _backdrop blur_ untuk memisahkan navigasi, bukan garis border hitam/abu-abu pekat yang merusak estetika _clean_.

---

> **Note**: Bananasbindery bukan sekadar aplikasi, ini adalah seni visual. Jaga setiap pixel dengan hati. ❤️🐾
