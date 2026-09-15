# Website HME UA

React + Vite, Node.js + Express, dan PostgreSQL. Layout publik dan dashboard mengikuti UI sebelumnya.

## Menjalankan Lokal

Prasyarat: Node.js 22.12+ dan PostgreSQL 16+ yang aktif.

```sh
npm install
# Sekali pada Mac dengan PostgreSQL Homebrew aktif:
npm run setup:local
npm run dev
```

Frontend: http://localhost:5173. API: http://localhost:3001/api/health. Vite memilih port berikutnya jika 5173 terpakai; tambahkan origin tersebut ke APP_ORIGINS di .env bila perlu. Proxy Vite menunjuk port API 3001.

Setup lokal membuat database `hme_website`, schema `hme`, data contoh dari UI lama, serta admin lokal. Email dan password acak ada di `.env`: `LOCAL_ADMIN_EMAIL` dan `LOCAL_ADMIN_PASSWORD`. Password akun di database di-hash dengan scrypt. LOCAL_ADMIN_* hanya catatan kredensial hasil setup; mengubahnya tidak mengubah password database.

Untuk PostgreSQL di mesin lain, gunakan .env.example sebagai acuan, isi DATABASE_URL, SESSION_SECRET acak minimal 32 karakter, ADMIN_INVITE_CODE, dan APP_ORIGINS, lalu jalankan `npm run db:migrate`. Buat admin pertama melalui /register menggunakan kode undangan. Setup tidak menimpa .env yang sudah ada.

## Halaman & Fitur

- /login atau /sign-in: login admin; /register atau /sign-up: pendaftaran admin memakai ADMIN_INVITE_CODE dari pengelola.
- /dashboard: CRUD TENSI, kegiatan, alumni, dosen, pimpinan dan divisi; pencarian; pengaturan; peninjauan kiriman; logout.
- /alumni/kirim: kiriman info alumni, baru tampil publik setelah disetujui.
- /daftar-anggota: pendaftaran anggota, NIM unik; anggota disetujui masuk statistik.
- Beranda, TENSI, kegiatan, dan alumni membaca API. Detail konten dan tautan tersedia dari kartu atau tombol Selengkapnya.
- Unggahan JPEG/PNG/WebP maksimal 5 MB dikonversi ke WebP, disimpan di PostgreSQL. Sesi admin juga disimpan di database.
- Alamat, periode, email, telepon, dan tautan sosial dapat diubah di Pengaturan. Tautan sosial kosong dinonaktifkan sampai diisi.

Data awal adalah **contoh dari frontend sebelumnya**, bukan data organisasi terverifikasi. Statistik memakai jumlah record, bukan angka contoh 185 anggota.

## Database

DDL: server/schema.sql. Migrasi dan seed idempotent: `npm run db:migrate`. Seed hanya sekali dan tidak mengembalikan konten yang dihapus.

| Tabel dalam schema hme | Isi |
| --- | --- |
| admins | Identitas admin dan hash password |
| sessions | Sesi login yang tetap tersedia setelah restart |
| content | TENSI, kegiatan, alumni, dosen, pimpinan, divisi dalam JSONB tervalidasi per jenis |
| submissions | Kiriman alumni dan anggota, status dan peninjau |
| settings | Kontak, periode, tautan sosial |
| media | Bytes gambar WebP |
| migrations | Riwayat inisialisasi |

## API

Prefiks semua endpoint: /api. Mutasi memerlukan cookie sesi dan header x-csrf-token dari GET /auth/csrf. Login/register merotasi sesi dan mengembalikan token baru di csrf.

- POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me.
- GET /site, GET /health, GET /settings; PUT /settings dan GET /dashboard/stats untuk admin.
- GET /:kind, GET /:kind/:id, POST /:kind, PUT /:kind/:id, DELETE /:kind/:id; kind: tensi, kegiatan, alumni, dosen, petinggi, divisi. Semua mutasi memerlukan admin. Daftar menerima q dan category.
- POST /submissions/alumni dan POST /submissions/anggota untuk publik; GET /submissions dan PATCH /submissions/:id/status untuk admin (approved atau rejected). Peninjauan final memakai transaksi untuk mencegah publikasi ganda.
- POST /media untuk admin, multipart field file; GET /media/:id untuk publik.

## Verifikasi

```sh
npm test
npm run lint
npm run build
```

Tes integrasi membuat database sementara hme_test_*, menjalankan HTTP sungguhan dan migrasi, lalu menghapus database tes. Role DATABASE_URL memerlukan CREATEDB untuk tes. Database aplikasi tidak diubah.

## Build Production

```sh
npm run build
npm start
```

Express melayani frontend dan API. Pasang HTTPS di reverse proxy, set APP_ORIGINS ke domain tujuan dan HOST sesuai kebutuhan. Set TRUST_PROXY=1 hanya untuk satu reverse proxy tepercaya. Cookie production memakai Secure sehingga login memerlukan HTTPS. .env tidak masuk git; gunakan secret baru di server tujuan. Semua akun berkode undangan mempunyai hak admin penuh.
