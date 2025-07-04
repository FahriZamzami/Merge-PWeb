// seeder.js
const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt'); // bcrypt tidak lagi diperlukan

const prisma = new PrismaClient();

async function main() {
    console.log('Memulai proses seeding... 🌱');

    // 1. Kata sandi tidak lagi di-hash.
    // Blok kode untuk hashing menggunakan bcrypt telah dihapus.
    console.log('Menyiapkan kata sandi (plain text)... ✅');

    // 2. Membersihkan data lama untuk menghindari konflik
    console.log('Membersihkan data lama dari database...');
    // Urutan penghapusan harus terbalik dari pembuatan untuk menghindari error foreign key
    await prisma.pengumpulan.deleteMany({});
    await prisma.absensi.deleteMany({});
    await prisma.modul.deleteMany({});
    await prisma.pengumuman.deleteMany({});
    await prisma.tugas.deleteMany({});
    await prisma.jadwal.deleteMany({});
    await prisma.mahasiswa.deleteMany({});
    await prisma.asistenLab.deleteMany({});
    await prisma.praktikum.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.lab.deleteMany({});
    console.log('Data lama berhasil dihapus. 🗑️');

    // 3. Memasukkan data baru ke dalam tabel

    // Tabel tanpa ketergantungan
    await prisma.lab.createMany({
        data: [
            { id: 1, nama_lab: 'Laboratory of Business Inteligence' },
            { id: 2, nama_lab: 'Geographic Information System' },
            { id: 3, nama_lab: 'Laboratorium Dasar Komputasi' },
            { id: 4, nama_lab: 'Laboratory of Enterprise Application' },
        ],
    });
    console.log('Tabel `Lab` berhasil di-seed.');

    // Tabel User dengan kata sandi plain text sesuai peran
    const users = [
        { id: '02', username: 'della', peran: 'mahasiswa' },
        { id: '2311522031', username: 'Pablo', peran: 'mahasiswa' },
        { id: '2311522056', username: 'budi', peran: 'mahasiswa' },
        { id: '2411521001', username: 'mhs001', peran: 'mahasiswa' },
        { id: '2411521002', username: 'mhs002', peran: 'mahasiswa' },
        { id: '2411521003', username: 'mhs003', peran: 'mahasiswa' },
        { id: '2411521004', username: 'mhs004', peran: 'mahasiswa' },
        { id: '2411521005', username: 'mhs005', peran: 'mahasiswa' },
        { id: '2411521006', username: 'mhs006', peran: 'mahasiswa' },
        { id: '2411521007', username: 'mhs007', peran: 'mahasiswa' },
        { id: '2411521008', username: 'mhs008', peran: 'mahasiswa' },
        { id: '2411521009', username: 'mhs009', peran: 'mahasiswa' },
        { id: '2411521010', username: 'mhs010', peran: 'mahasiswa' },
        { id: '2411522020', username: 'Vannesa', peran: 'mahasiswa' },
        { id: '2511521030', username: 'Fachri Akbar', peran: 'mahasiswa' },
        { id: 'adm001', username: 'admin', peran: 'admin' },
        { id: 'aslgis001', username: 'Aufa Lubis', peran: 'asisten' },
        { id: 'asllbi001', username: 'Fahri Zamzami', peran: 'asisten' },
        { id: 'aslldkom001', username: 'Sherly Ayuma', peran: 'asisten' },
        { id: 'asllea001', username: 'Vannesa Tania', peran: 'asisten' },
    ];

    const usersWithPasswords = users.map(user => {
        let kata_sandi;
        switch (user.peran) {
            case 'admin':
                kata_sandi = 'sayasukadurian'; // Plain text
                break;
            case 'asisten':
                kata_sandi = 'labkece123'; // Plain text
                break;
            case 'mahasiswa':
                kata_sandi = 'password123'; // Plain text
                break;
        }
        return { ...user, kata_sandi };
    });

    await prisma.user.createMany({
        data: usersWithPasswords,
    });
    console.log('Tabel `User` berhasil di-seed.');

    // Tabel Praktikum
    await prisma.praktikum.createMany({
        data: [
            { id: 1, nama_praktikum: 'Data Mining 2024', kode_masuk: 'damin2024', lab_id: 1 },
            { id: 2, nama_praktikum: 'Data Mining B 2024', kode_masuk: 'daminb2024', lab_id: 1 },
            { id: 3, nama_praktikum: 'Data Mining A 2024', kode_masuk: 'daminA2024', lab_id: 1 },
            { id: 4, nama_praktikum: 'Data mining B 2025', kode_masuk: 'daminb2025', lab_id: 1 },
        ],
    });
    console.log('Tabel `Praktikum` berhasil di-seed.');

    // Tabel AsistenLab
    await prisma.asistenLab.createMany({
        data: [
            { user_id: 'asllbi001', lab_id: 1 },
            { user_id: 'aslgis001', lab_id: 2 },
            { user_id: 'aslldkom001', lab_id: 3 },
            { user_id: 'asllea001', lab_id: 4 },
        ],
    });
    console.log('Tabel `AsistenLab` berhasil di-seed.');

    // Tabel Mahasiswa
    await prisma.mahasiswa.createMany({
        data: [
            { user_id: '2411521001', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521002', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521003', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521004', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521005', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521006', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521007', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521008', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521009', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411521010', praktikum_id: 1, waktu_daftar: new Date('2025-06-22T08:46:31.000Z') },
            { user_id: '2411522020', praktikum_id: 1, waktu_daftar: new Date('2025-06-18T22:54:51.000Z') },
            { user_id: '2411521001', praktikum_id: 2, waktu_daftar: new Date('2025-06-28T08:43:04.147Z') },
            { user_id: '2411521001', praktikum_id: 4, waktu_daftar: new Date('2025-06-28T08:45:54.142Z') },
            { user_id: '2511521030', praktikum_id: 1, waktu_daftar: new Date('2025-06-28T12:04:50.586Z') },
        ],
    });
    console.log('Tabel `Mahasiswa` berhasil di-seed.');

    // Tabel Jadwal
    await prisma.jadwal.createMany({
        data: [
            { id: 1, praktikum_id: 1, tanggal: new Date('2025-06-23T03:45:00.000Z'), jam: new Date('2025-06-23T03:45:00.000Z'), ruangan: 'H 1.7', materi: 'K-Means', nama_pengajar: 'Fariz', status: 'Selesai' },
            { id: 2, praktikum_id: 1, tanggal: new Date('2025-06-25T12:12:00.000Z'), jam: new Date('2025-06-25T12:12:00.000Z'), ruangan: 'H 1.9', materi: 'p', nama_pengajar: 'Beliau', status: 'Selesai' },
            { id: 3, praktikum_id: 3, tanggal: new Date('2025-06-24T16:04:00.000Z'), jam: new Date('2025-06-24T16:04:00.000Z'), ruangan: 'Seminar SI', materi: 'FP-Growth', nama_pengajar: 'Aldi ganteng 123', status: 'Belum_Mulai' },
            { id: 4, praktikum_id: 1, tanggal: new Date('2025-06-30T03:40:00.000Z'), jam: new Date('2025-06-30T03:40:00.000Z'), ruangan: 'H 1.7', materi: 'CNN', nama_pengajar: 'Saya', status: 'Belum_Mulai' },
        ],
    });
    console.log('Tabel `Jadwal` berhasil di-seed.');

    // Tabel Tugas
    await prisma.tugas.createMany({
        data: [
            { id: 2, praktikum_id: 1, judul: 'Instruksi 1', deskripsi: 'as', fileTugas: '1750597772748-Daftar_Mahasiswa_Data_Mining_2024.pdf', batas_waktu: new Date('2025-06-29T16:59:00.000Z'), status: 'close', tutup_penugasan: true },
            { id: 5, praktikum_id: 1, judul: 'Instruksi 2', deskripsi: 'KJkjkhkahsda', fileTugas: '1751108342008-Doc1.docx', batas_waktu: new Date('2025-06-30T16:59:00.000Z'), status: 'close', tutup_penugasan: false },
            { id: 7, praktikum_id: 1, judul: 'Instruksi 3', deskripsi: 'KL', fileTugas: '1751211719134-Kelompok 3 Daspro(perulangan).pdf', batas_waktu: new Date('2025-06-30T16:59:00.000Z'), status: 'close', tutup_penugasan: true },
        ],
    });
    console.log('Tabel `Tugas` berhasil di-seed.');
    
    // Tabel Pengumpulan
    await prisma.pengumpulan.createMany({
        data: [
            { tugas_id: 2, user_id: '2411521001', file_path: '1750436913593-Instruksi-Modul-Praktikum-Data-Mining-B (3).png', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521002', file_path: '1750436880889-Tugas Bootcamp BE Pertemuan 2 - Fahri Zamzami.pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521003', file_path: '1750432553186-1150-1-3005-1-10-20231216 (1).pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521004', file_path: '1750417976506-download.jpeg', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521005', file_path: '1750361497720-1150-1-3005-1-10-20231216.pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521006', file_path: '1750169581735-MODUL_1_2.pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521007', file_path: '1750169861030-22280-65234-7-PB.pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521008', file_path: '1750297832570-Cetak Rencana Studi - Portal Akademik Universitas Andalas.pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521009', file_path: '1750298090008-KRS UAS SEMESTER 4.pdf', waktu_kirim: new Date(), nilai: null, catatan: null },
            { tugas_id: 2, user_id: '2411521010', file_path: '1750298928877-WhatsApp Image 2025-05-21 at 12.20.55_3babbe2f.jpg', waktu_kirim: new Date(), nilai: null, catatan: null },
        ],
    });
    console.log('Tabel `Pengumpulan` berhasil di-seed.');

    console.log('\nProses seeding selesai dengan sukses! 🎉');
}

main()
    .catch((e) => {
        console.error('Terjadi kesalahan saat seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        // Tutup koneksi Prisma
        await prisma.$disconnect();
    });
