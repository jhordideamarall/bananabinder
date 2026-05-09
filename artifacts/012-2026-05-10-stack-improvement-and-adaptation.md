# 2026-05-10 — Stack Improvement & Adaptation (Drizzle, Lenis, Tabler)

## Rationale
Kami melakukan improvisasi pada tech stack untuk meningkatkan kualitas DX (Developer Experience) dan UX (User Experience) tanpa mengubah logika bisnis yang sudah didefinisikan di `PRD.md`.

### 1. Drizzle ORM (Database Layer)
- **Improvement**: Menggantikan query raw Supabase dengan Drizzle ORM.
- **Manfaat**: Memberikan type-safety penuh pada level database. `schema.ts` sekarang menjadi *single source of truth* untuk struktur tabel.
- **Alignments**: Tetap menggunakan PostgreSQL (Supabase) sebagai database utama. Drizzle hanya bertindak sebagai layer abstraksi yang lebih modern dan efisien.

### 2. Lenis Scroll (UX Layer)
- **Improvement**: Penambahan smooth scrolling menggunakan Lenis.
- **Manfaat**: Memberikan efek scroll yang halus dan terasa "native" di perangkat premium, sesuai dengan target pasar Bananasbindery (Premium Stationery).
- **Alignments**: Tidak mengubah struktur DOM, hanya meningkatkan interaksi scroll secara global.

### 3. Tabler Icons (Visual Layer)
- **Improvement**: Migrasi dari Lucide Icons ke Tabler Icons.
- **Manfaat**: Tabler Icons memiliki library yang lebih luas dan konsisten untuk desain e-commerce modern.
- **Alignments**: Memperkuat estetika "Clean & Minimalist" yang diminta di PRD.

## Impact Analysis

| Area | Impact | Mitigation |
|------|--------|------------|
| **Database** | Tidak ada perubahan schema fisik. | Schema Drizzle dimapping tepat sesuai migrasi SQL yang ada. |
| **API Routes** | Logic tetap sama, hanya cara query yang berubah menjadi lebih type-safe. | Refactoring dilakukan bertahap, fungsi RPC tetap bisa dipanggil via Supabase client. |
| **Performance** | Lenis sangat ringan (bundle size kecil). | Konfigurasi `lerp: 0.1` memastikan performa tetap stabil di device low-end. |

## Rencana Kedepan
Setiap penulisan kode baru untuk API dan UI akan langsung menggunakan stack hasil improvisasi ini (Drizzle + Tabler) untuk konsistensi.
