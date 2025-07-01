// src/controllers/absensi.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi getAbsensiPage tidak perlu diubah
const getAbsensiPage = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);
        const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });

        if (!praktikum) return res.status(404).send('Praktikum tidak ditemukan');

        const mahasiswaList = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: { user: true },
            orderBy: { user: { id: 'asc' } }
        });

        const jadwalList = await prisma.jadwal.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { tanggal: 'asc' }
        });
        
        const existingAbsensi = await prisma.absensi.findMany({
            where: { jadwal: { praktikum_id: praktikumId } }
        });

        res.render('absensi', {
            title: 'Ambil Absensi',
            praktikum,
            mahasiswaList,
            jadwalList,
            existingAbsensi: JSON.stringify(existingAbsensi)
        });
    } catch (error) {
        console.error("Error fetching absensi page:", error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

// Fungsi saveAbsensi tidak perlu diubah
const saveAbsensi = async (req, res) => {
    try {
        const { praktikum_id, jadwal_id, kehadiran } = req.body;

        if (!jadwal_id || !kehadiran) {
            return res.status(400).send('Jadwal dan data kehadiran harus dipilih');
        }

        const jadwalIdInt = parseInt(jadwal_id);

        for (const userId in kehadiran) {
            const status = kehadiran[userId];

            const existingAbsensi = await prisma.absensi.findFirst({
                where: { user_id: userId, jadwal_id: jadwalIdInt, }
            });

            if (existingAbsensi) {
                await prisma.absensi.update({
                    where: { id: existingAbsensi.id },
                    data: { status: status },
                });
            } else {
                await prisma.absensi.create({
                    data: { user_id: userId, jadwal_id: jadwalIdInt, status: status, }
                });
            }
        }

        res.redirect(`/praktikum/${praktikum_id}/mahasiswa`);
    } catch (error) {
        console.error("Error saving absensi:", error);
        res.status(500).send('Gagal menyimpan absensi');
    }
};

// Fungsi getDetailKehadiranPage dengan ORDER BY yang sudah diperbaiki

// FUNGSI HELPER BARU
async function getRekapKehadiranData(praktikumId) {
    const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });
    if (!praktikum) throw new Error('Praktikum tidak ditemukan');

    const mahasiswaList = await prisma.mahasiswa.findMany({
        where: { praktikum_id: praktikumId },
        include: { user: { select: { id: true, username: true } } },
        orderBy: { user: { id: 'asc' } }
    });

    const jadwalList = await prisma.jadwal.findMany({
        where: { praktikum_id: praktikumId },
        orderBy: [{ tanggal: 'asc' }, { id: 'asc' }]
    });

    const allAbsensi = await prisma.absensi.findMany({
        where: { jadwal: { praktikum_id: praktikumId } }
    });

    const rekapData = mahasiswaList.map(mhs => {
        let totalHadir = 0;
        const kehadiranPerJadwal = jadwalList.map(jadwal => {
            const absensiRecord = allAbsensi.find(absen => 
                absen.user_id === mhs.user_id && absen.jadwal_id === jadwal.id
            );
            if (absensiRecord?.status === 'Hadir') {
                totalHadir++;
            }
            return absensiRecord ? absensiRecord.status : '-';
        });
        const totalTidakHadir = kehadiranPerJadwal.filter(status => status !== 'Hadir' && status !== '-').length;
        return {
            nim: mhs.user.id,
            nama: mhs.user.username,
            kehadiran: kehadiranPerJadwal,
            totalHadir,
            totalTidakHadir
        };
    });

    return { praktikum, jadwalList, rekapData };
}

// Modifikasi getDetailKehadiranPage untuk menggunakan helper
const getDetailKehadiranPage = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);
        const { praktikum, jadwalList, rekapData } = await getRekapKehadiranData(praktikumId);

        res.render('detailKehadiran', {
            title: `Detail Kehadiran - ${praktikum.nama_praktikum}`,
            praktikum,
            jadwalList,
            rekapData,
        });
    } catch (error) {
        console.error("Error fetching detail kehadiran:", error);
        res.status(500).send(error.message || 'Terjadi kesalahan pada server');
    }
};

// ... (fungsi getAbsensiPage dan saveAbsensi tetap sama) ...

module.exports = { 
    getAbsensiPage, 
    saveAbsensi, 
    getDetailKehadiranPage,
    getRekapKehadiranData // Ekspor helper agar bisa digunakan controller lain
};
