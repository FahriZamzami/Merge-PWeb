const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Memulai proses seeding khusus untuk Admin dan Asisten... 👨‍💻');

    // 1. Hash kata sandi yang dibutuhkan
    const saltRounds = 10;
    console.log('Menyiapkan dan mengenkripsi kata sandi...');
    const adminPassword = await bcrypt.hash('sayasukadurian', saltRounds);
    const asistenPassword = await bcrypt.hash('labkece123', saltRounds);
    console.log('Kata sandi berhasil dienkripsi. ✅');

    // 2. Membersihkan data pada tabel yang relevan
    console.log('Membersihkan data lama dari tabel target...');
    // Hapus asistenlab terlebih dahulu karena memiliki foreign key ke user dan lab
    await prisma.asistenLab.deleteMany({});
    await prisma.user.deleteMany({
        where: {
            OR: [
                { peran: 'admin' },
                { peran: 'asisten' },
            ],
        },
    });
    await prisma.lab.deleteMany({});
    console.log('Data lama pada tabel target berhasil dihapus. 🗑️');

    // 3. Memasukkan data baru (seeding)

    // A. Seed tabel 'lab'
    await prisma.lab.createMany({
        data: [
            { id: 1, nama_lab: 'Laboratory of Business Inteligence' },
            { id: 2, nama_lab: 'Geographic Information System' },
            { id: 3, nama_lab: 'Laboratorium Dasar Komputasi' },
            { id: 4, nama_lab: 'Laboratory of Enterprise Application' },
        ],
    });
    console.log('Tabel `Lab` berhasil di-seed.');

    // B. Siapkan dan seed data 'user' untuk admin dan asisten
    const usersToSeed = [
        { id: 'adm001', username: 'admin', peran: 'admin', kata_sandi: adminPassword },
        { id: 'aslgis001', username: 'Aufa Lubis', peran: 'asisten', kata_sandi: asistenPassword },
        { id: 'asllbi001', username: 'Fahri Zamzami', peran: 'asisten', kata_sandi: asistenPassword },
        { id: 'aslldkom001', username: 'Sherly Ayuma', peran: 'asisten', kata_sandi: asistenPassword },
        { id: 'asllea001', username: 'Vannesa Tania', peran: 'asisten', kata_sandi: asistenPassword },
    ];

    await prisma.user.createMany({
        data: usersToSeed,
    });
    console.log('Tabel `User` (Admin & Asisten) berhasil di-seed.');

    // C. Seed tabel 'asistenlab' yang menghubungkan user asisten dengan lab
    await prisma.asistenLab.createMany({
        data: [
            { user_id: 'asllbi001', lab_id: 1 },
            { user_id: 'aslgis001', lab_id: 2 },
            { user_id: 'aslldkom001', lab_id: 3 },
            { user_id: 'asllea001', lab_id: 4 },
        ],
    });
    console.log('Tabel `AsistenLab` berhasil di-seed.');

    console.log('\nProses seeding khusus selesai dengan sukses! 🎉');
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