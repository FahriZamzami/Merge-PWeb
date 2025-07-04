const prisma = require('../../prisma/client');

const jadwalMahasiswaController = {
    /**
     * Menampilkan halaman jadwal praktikum untuk mahasiswa.
     * Mengambil ID kelas praktikum dari session.
     */
    getJadwalMahasiswaPage: async (req, res) => {
        try {

            const praktikumId = req.session.idKelasDipilih;

            if (!praktikumId) {

                return res.redirect('/dashboard-kelas');
            }


            const praktikum = await prisma.praktikum.findUnique({
                where: { id: praktikumId },
                include: { lab: true } // Sertakan info lab untuk sidebar
            });

            if (!praktikum) {
                return res.status(404).send('Praktikum tidak ditemukan.');
            }


            const jadwalFromDb = await prisma.jadwal.findMany({
                where: { praktikum_id: praktikumId },
                orderBy: { tanggal: 'asc' }
            });


            const daftarJadwal = jadwalFromDb.map((item, index) => {
                const tanggal = new Date(item.tanggal);
                return {
                    ...item,
                    pertemuan: `Pertemuan ${index + 1}`,
                    tanggal_formatted: tanggal.toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    }),

                    jam_formatted: item.jam, 
                    dibuat_pada_formatted: new Date(item.dibuat_pada).toLocaleDateString('id-ID')
                };
            });

            res.render('jadwalMahasiswa', {
                title: `Jadwal - ${praktikum.nama_praktikum}`,
                praktikum,
                daftarJadwal,
                user: req.session.user,
                currentPage: 'jadwal' // Untuk menandai menu aktif di sidebar
            });

        } catch (error) {
            console.error("❌ Error saat mengambil data jadwal:", error);
            res.status(500).send("Terjadi kesalahan pada server.");
        }
    },


};

module.exports = jadwalMahasiswaController;
