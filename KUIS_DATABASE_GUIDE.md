# Panduan Database Kuis - LabCorner

## Struktur Tabel Kuis

Sistem kuis terdiri dari 4 tabel utama yang saling berelasi:

### 1. Tabel `kuis`
Tabel utama untuk menyimpan informasi kuis.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT | Primary Key, Auto Increment |
| `praktikum_id` | INT | Foreign Key ke tabel praktikum |
| `judul` | VARCHAR(255) | Judul kuis |
| `deskripsi` | TEXT | Deskripsi kuis (opsional) |
| `waktu_mulai` | DATETIME | Waktu mulai kuis |
| `waktu_selesai` | DATETIME | Waktu selesai kuis |
| `durasi_menit` | INT | Durasi pengerjaan dalam menit (default: 60) |
| `status` | ENUM | Status kuis: 'aktif' atau 'tidak_aktif' |
| `dibuat_pada` | DATETIME | Timestamp pembuatan kuis |

### 2. Tabel `pertanyaan`
Tabel untuk menyimpan pertanyaan-pertanyaan dalam kuis.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT | Primary Key, Auto Increment |
| `kuis_id` | INT | Foreign Key ke tabel kuis |
| `pertanyaan` | TEXT | Teks pertanyaan |
| `tipe` | ENUM | Tipe pertanyaan: 'pilihan_ganda', 'benar_salah', 'essay' |
| `opsi_a` | VARCHAR(500) | Opsi A (untuk pilihan ganda) |
| `opsi_b` | VARCHAR(500) | Opsi B (untuk pilihan ganda) |
| `opsi_c` | VARCHAR(500) | Opsi C (untuk pilihan ganda) |
| `opsi_d` | VARCHAR(500) | Opsi D (untuk pilihan ganda) |
| `opsi_e` | VARCHAR(500) | Opsi E (untuk pilihan ganda) |
| `jawaban_benar` | TEXT | Jawaban yang benar |
| `poin` | INT | Poin untuk pertanyaan ini (default: 1) |
| `urutan` | INT | Urutan pertanyaan (opsional) |

### 3. Tabel `jawaban_kuis`
Tabel untuk tracking siapa yang mengerjakan kuis.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT | Primary Key, Auto Increment |
| `kuis_id` | INT | Foreign Key ke tabel kuis |
| `user_id` | VARCHAR(255) | Foreign Key ke tabel user |
| `waktu_mulai` | DATETIME | Waktu mulai mengerjakan |
| `waktu_selesai` | DATETIME | Waktu selesai mengerjakan |
| `total_poin` | FLOAT | Total poin yang didapat |
| `status` | VARCHAR(50) | Status: 'sedang_berlangsung', 'selesai', 'terlambat' |

### 4. Tabel `jawaban_pertanyaan`
Tabel untuk menyimpan jawaban per pertanyaan.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT | Primary Key, Auto Increment |
| `jawaban_kuis_id` | INT | Foreign Key ke tabel jawaban_kuis |
| `pertanyaan_id` | INT | Foreign Key ke tabel pertanyaan |
| `jawaban_user` | TEXT | Jawaban yang diberikan user |
| `poin_didapat` | FLOAT | Poin yang didapat untuk pertanyaan ini |
| `waktu_jawab` | DATETIME | Waktu menjawab pertanyaan |

## Cara Menambahkan Tabel ke Database

### Opsi 1: Menggunakan File SQL (Manual)
1. Buka MySQL client atau phpMyAdmin
2. Jalankan script SQL dari file `kuis_tables.sql`
3. Pastikan database LabCorner sudah dipilih

### Opsi 2: Menggunakan Prisma Migration
1. Jalankan: `npx prisma migrate dev --name add_kuis_tables`
2. Prisma akan membuat migration file otomatis

## Contoh Query SQL

### Membuat Kuis Baru
```sql
INSERT INTO kuis (praktikum_id, judul, deskripsi, waktu_mulai, waktu_selesai, durasi_menit, status) 
VALUES (1, 'Kuis Praktikum 1', 'Kuis untuk menguji pemahaman materi praktikum', '2024-01-01 10:00:00', '2024-01-01 11:00:00', 60, 'aktif');
```

### Menambahkan Pertanyaan Pilihan Ganda
```sql
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin, urutan)
VALUES (1, 'Apa kepanjangan dari HTML?', 'pilihan_ganda', 'HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language', 'HyperText Markup Language', 1, 1);
```

### Menambahkan Pertanyaan Benar/Salah
```sql
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan)
VALUES (1, 'JavaScript adalah bahasa pemrograman server-side', 'benar_salah', 'salah', 1, 2);
```

### Menambahkan Pertanyaan Essay
```sql
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan)
VALUES (1, 'Jelaskan perbedaan antara HTML dan CSS', 'essay', 'HTML untuk struktur, CSS untuk styling', 5, 3);
```

## Relasi Antar Tabel

```
praktikum (1) ←→ (N) kuis
kuis (1) ←→ (N) pertanyaan
kuis (1) ←→ (N) jawaban_kuis
user (1) ←→ (N) jawaban_kuis
jawaban_kuis (1) ←→ (N) jawaban_pertanyaan
pertanyaan (1) ←→ (N) jawaban_pertanyaan
```

## Index untuk Performa

File SQL sudah mencakup index untuk optimasi performa:
- `idx_kuis_praktikum`: Untuk query kuis berdasarkan praktikum
- `idx_kuis_status`: Untuk query kuis berdasarkan status
- `idx_pertanyaan_kuis`: Untuk query pertanyaan berdasarkan kuis
- `idx_jawaban_kuis_user`: Untuk query jawaban berdasarkan user
- `idx_jawaban_kuis_kuis`: Untuk query jawaban berdasarkan kuis
- `idx_jawaban_pertanyaan_jawaban_kuis`: Untuk query jawaban pertanyaan
- `idx_jawaban_pertanyaan_pertanyaan`: Untuk query jawaban berdasarkan pertanyaan

## Catatan Penting

1. **Foreign Key Constraints**: Semua relasi menggunakan CASCADE DELETE untuk menjaga integritas data
2. **Enum Values**: Pastikan nilai enum sesuai dengan yang didefinisikan
3. **Timestamps**: Gunakan format DATETIME untuk konsistensi
4. **Index**: Index sudah dioptimasi untuk query yang sering digunakan 