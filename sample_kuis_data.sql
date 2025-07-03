-- Contoh data kuis untuk testing
-- Pastikan tabel sudah dibuat dan ada data praktikum dengan id = 1

-- 1. Membuat kuis untuk praktikum
INSERT INTO kuis (praktikum_id, judul, deskripsi, waktu_mulai, waktu_selesai, durasi_menit, status) VALUES
(1, 'Kuis Praktikum 1 - Dasar HTML', 'Kuis untuk menguji pemahaman dasar HTML dan CSS', '2024-12-25 10:00:00', '2024-12-25 11:00:00', 60, 'aktif'),
(1, 'Kuis Praktikum 2 - JavaScript', 'Kuis untuk menguji pemahaman JavaScript dasar', '2024-12-26 14:00:00', '2024-12-26 15:00:00', 45, 'tidak_aktif'),
(1, 'Kuis Praktikum 3 - Database', 'Kuis untuk menguji pemahaman konsep database', '2024-12-27 09:00:00', '2024-12-27 10:30:00', 90, 'tidak_aktif');

-- 2. Menambahkan pertanyaan pilihan ganda untuk kuis 1
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin, urutan) VALUES
(1, 'Apa kepanjangan dari HTML?', 'pilihan_ganda', 'HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language', 'HyperText Markup Language', 1, 1),
(1, 'Tag HTML untuk membuat paragraf adalah?', 'pilihan_ganda', '<p>', '<paragraph>', '<text>', '<para>', '<p>', 1, 2),
(1, 'Apa kepanjangan dari CSS?', 'pilihan_ganda', 'Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets', 'Cascading Style Sheets', 1, 3),
(1, 'Tag HTML untuk membuat link adalah?', 'pilihan_ganda', '<link>', '<a>', '<href>', '<url>', '<a>', 1, 4),
(1, 'Property CSS untuk mengubah warna teks adalah?', 'pilihan_ganda', 'text-color', 'color', 'font-color', 'text-style', 'color', 1, 5);

-- 3. Menambahkan pertanyaan benar/salah untuk kuis 1
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan) VALUES
(1, 'HTML adalah bahasa pemrograman', 'benar_salah', 'salah', 1, 6),
(1, 'CSS digunakan untuk styling halaman web', 'benar_salah', 'benar', 1, 7),
(1, 'Tag <br> digunakan untuk membuat baris baru', 'benar_salah', 'benar', 1, 8),
(1, 'JavaScript adalah bahasa pemrograman server-side', 'benar_salah', 'salah', 1, 9);

-- 4. Menambahkan pertanyaan essay untuk kuis 1
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan) VALUES
(1, 'Jelaskan perbedaan antara HTML dan CSS dalam pengembangan web', 'essay', 'HTML untuk struktur konten, CSS untuk styling dan tampilan', 5, 10),
(1, 'Apa fungsi dari tag <div> dalam HTML?', 'essay', 'Tag div digunakan sebagai container untuk mengelompokkan elemen HTML', 3, 11);

-- 5. Menambahkan pertanyaan untuk kuis 2 (JavaScript)
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin, urutan) VALUES
(2, 'Cara mendeklarasikan variabel di JavaScript adalah?', 'pilihan_ganda', 'var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;', 'var x = 5;', 1, 1),
(2, 'Method untuk menampilkan alert di JavaScript adalah?', 'pilihan_ganda', 'alert()', 'message()', 'popup()', 'show()', 'alert()', 1, 2),
(2, 'Operator untuk membandingkan nilai dan tipe data adalah?', 'pilihan_ganda', '==', '===', '=', '!=', '===', 1, 3);

-- 6. Menambahkan pertanyaan benar/salah untuk kuis 2
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan) VALUES
(2, 'JavaScript adalah bahasa pemrograman client-side', 'benar_salah', 'benar', 1, 4),
(2, 'Array di JavaScript dimulai dari index 1', 'benar_salah', 'salah', 1, 5),
(2, 'Function di JavaScript harus selalu mengembalikan nilai', 'benar_salah', 'salah', 1, 6);

-- 7. Menambahkan pertanyaan essay untuk kuis 2
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan) VALUES
(2, 'Jelaskan perbedaan antara var, let, dan const dalam JavaScript', 'essay', 'var: function-scoped, let: block-scoped, const: block-scoped dan tidak bisa diubah', 5, 7),
(2, 'Apa fungsi dari callback function dalam JavaScript?', 'essay', 'Callback function adalah function yang dipanggil setelah function lain selesai dieksekusi', 3, 8);

-- 8. Menambahkan pertanyaan untuk kuis 3 (Database)
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin, urutan) VALUES
(3, 'Apa kepanjangan dari SQL?', 'pilihan_ganda', 'Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language', 'Structured Query Language', 1, 1),
(3, 'Perintah SQL untuk mengambil data adalah?', 'pilihan_ganda', 'SELECT', 'GET', 'FETCH', 'RETRIEVE', 'SELECT', 1, 2),
(3, 'Perintah SQL untuk menambah data baru adalah?', 'pilihan_ganda', 'INSERT', 'ADD', 'CREATE', 'NEW', 'INSERT', 1, 3),
(3, 'Perintah SQL untuk mengubah data adalah?', 'pilihan_ganda', 'UPDATE', 'MODIFY', 'CHANGE', 'EDIT', 'UPDATE', 1, 4),
(3, 'Perintah SQL untuk menghapus data adalah?', 'pilihan_ganda', 'DELETE', 'REMOVE', 'DROP', 'CLEAR', 'DELETE', 1, 5);

-- 9. Menambahkan pertanyaan benar/salah untuk kuis 3
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan) VALUES
(3, 'Primary Key harus unik dan tidak boleh NULL', 'benar_salah', 'benar', 1, 6),
(3, 'Foreign Key digunakan untuk menghubungkan antar tabel', 'benar_salah', 'benar', 1, 7),
(3, 'Database MySQL adalah database NoSQL', 'benar_salah', 'salah', 1, 8),
(3, 'Index dapat mempercepat query database', 'benar_salah', 'benar', 1, 9);

-- 10. Menambahkan pertanyaan essay untuk kuis 3
INSERT INTO pertanyaan (kuis_id, pertanyaan, tipe, jawaban_benar, poin, urutan) VALUES
(3, 'Jelaskan perbedaan antara Primary Key dan Foreign Key', 'essay', 'Primary Key: unik identifier untuk tabel, Foreign Key: referensi ke Primary Key tabel lain', 5, 10),
(3, 'Apa fungsi dari JOIN dalam SQL?', 'essay', 'JOIN digunakan untuk menggabungkan data dari dua atau lebih tabel berdasarkan kondisi tertentu', 3, 11),
(3, 'Jelaskan konsep Normalisasi dalam database', 'essay', 'Normalisasi adalah proses mengorganisir data dalam database untuk mengurangi redundansi dan meningkatkan integritas data', 5, 12);

-- Catatan: Pastikan ada data praktikum dengan id = 1 sebelum menjalankan script ini
-- Jika praktikum dengan id = 1 tidak ada, ganti dengan id praktikum yang ada di database Anda 