# Aluna MVP — Desain Teknis

Tanggal: 2026-08-11 · Status: Draft final
Konteks: PRD (`ALUNA PRD.docx`), Module Breakdown (`ALUNA Module Breakdown.docx`), prototype 19 screen (`dear_hifi_v3.html`)

## 1. Keputusan Arsitektur

- **Web-first MVP**. Mobile (React Native) setelah investment.
- **Monorepo** (pnpm workspaces) dengan backend & frontend berpisah — API dipakai ulang oleh mobile nanti.
- **React Native Web/Expo TIDAK dipakai sekarang** — web & mobile tidak share UI; yang di-share: API + logika bisnis + types.
- Non-dev solo, AI-assisted → stack ringan & mainstream.

## 2. Stack

| Layer | Pilihan |
|---|---|
| API | Hono (TypeScript, Node runtime) |
| DB | PostgreSQL serverless — **Neon** (koneksi pooled) |
| ORM | Drizzle |
| Auth | Better Auth (email+password + Google OAuth) |
| Payment | Midtrans (Xendit cadangan) |
| Frontend | React + Vite + **shadcn/ui** (Tailwind v4), PWA-ready |
| Icons | **lucide-react** (TIDAK pakai emoji) |
| Data fetching | TanStack Query |
| State | Zustand (kalau perlu) |
| Deploy | **Coolify** (self-host), web + api masing-masing container |
| Monorepo tooling | pnpm workspaces |

## 2b. Design System (dari prototype `dear_hifi_v3.html`)

- **Identitas**: wellness watercolor hijau, hangat, tenang (bukan mental-health "klinis").
- **Typography**: heading = Fraunces (serif, italic untuk aksen brand), body = Plus Jakarta Sans. `.woff2`, `antialiased`, heading `leading-tight`, body `leading-relaxed`, ukuran basis 16px.
- **Colors** (hex → oklch di Tailwind `@theme`, dicek kontras better-colors):
  - `primary` `#2F6B4F` (brand hijau), `accent`/sun `#F4D06F`
  - `background` `#F4F1E8` (cream), `card` `#FBF9F3` (paper)
  - `muted-foreground` `#5C6B62` — teks di bg terang butuh lightness gap ≥ 0.35
- **Icons**: hanya **lucide-react**, stroke 1.5–2px match text weight, outline default. **Emoji dilarang** di seluruh UI (prototype pakai emoji 🌿🎉 dll → semua diganti icon profesional).
- **Komponen shadcn**: button, card, progress, dialog, input, radio-group, tabs, sheet, skeleton, toast, badge, avatar → di-theme ke tokens Aluna.
- **Journey map**: SVG winding path + pin milestone + titik berdenyut (port dari s8) jadi komponen `JourneyMap` accessible.
- **Aturan better-interface wajib**: focus ring visible, label tiap input, hit area ≥44px touch, spacing sebagai pembeda (minimal separator), tombol full-width di-inset, carousel "ngintip" item berikutnya, copy Indonesia konsisten verb-first, `prefers-reduced-motion`, `active:scale-[0.96]`, concentric radius, error bilang cara fix.

## 3. Struktur Monorepo

```
aluna/
├─ apps/
│  ├─ web/        → React + Vite + Tailwind (PWA-ready)
│  └─ api/        → Hono (Node runtime)
├─ packages/
│  └─ shared/     → types + rumus scoring
└─ mobile/        → React Native (nanti, setelah invest)
```

## 4. Data Model (MVP)

- `users` — akun, autentikasi (Better Auth)
- `assessment_responses` — jawaban mentah 30 Q (untuk tren/check-in & red-flag)
- `assessment_results` — skor per dimensi, masalah utama, label
- `unlocks` — status paywall Rp99k per user
- `therapists` — profil, spesialisasi, rating, harga, lokasi
- `schedules` — slot ketersediaan therapist (tanggal + waktu + mode online/offline)
- `bookings` — sesi terjadwal (pakai paket / satuan)
- `packages` — paket 6/12/24 sesi
- `payments` / `transactions` — riwayat pembayaran, status, metadata Midtrans

## 5. Logika Inti (di `packages/shared`)

- **Scoring engine** (PRD Bagian 5): 7 dimensi → poin → persentase → masalah utama. Ambang skor & bobot tidak di-hardcode (bisa diubah tanpa redeploy, sesuai Module Breakdown catatan teknis).
- **Red-flag protocol (Q30, WAJIB)**: pertanyaan 30 tidak masuk skor. Bila terpicu → hentikan alur, simpan terpisah/dienkripsi, tampilkan layar dukungan + hotline. Tidak dipakai untuk marketing.
- **Roadmap & next-best-action**: rule-based sederhana dari masalah utama + progres (bukan ML di MVP).

## 6. Scope MVP

| Modul | Status |
|---|---|
| M1 Akun/Auth | ✅ Better Auth + hasil tertaut ke user |
| M2 Assessment | ✅ linear 30 Q, simpan jawaban mentah, scoring, hasil |
| M3 Roadmap+Paywall | ✅ 2 langkah terlihat, sisanya blur → unlock Rp99k |
| M4 Direktori+Booking | ✅ CRUD therapist, cari/filter, kalender slot, online/offline |
| M5 Pembayaran | ✅ Midtrans: unlock, sesi (diskon 50% pertama), paket. Split 40/60 (manual dulu / cron) |
| M6 Homescreen | ✅ peta perjalanan visual + progress ribbon + daily task stack + section geser |
| M7 Notifikasi | ⚠️ di web = email reminder (push butuh mobile, ditunda) |
| M10 Admin minimal | ✅ CRUD therapist + lihat booking |

Ditunda (v1.1+): poin/reward, komunitas in-app, journal, weekly check-in, assessment adaptif, reschedule/cancel, refund, invoice.

## 7. Kebutuhan Non-Fungsional

- Data kesehatan mental = sensitif: enkripsi, jawaban red-flag paling ketat, tidak dijual.
- Performa cepat & mulus (keunggulan vs kompetitor lemot).
- Arsitektur siap tambah modul v1.1 tanpa bongkar ulang.
- Env var dikelola via UI Coolify, tidak di-commit.