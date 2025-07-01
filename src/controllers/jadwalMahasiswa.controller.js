const prisma = require('../../prisma/client');

const jadwalMahasiswaController = {
    /**
     * Menampilkan halaman jadwal praktikum untuk mahasiswa.
     * Mengambil ID kelas praktikum dari session.
     */
    getJadwalMahasiswaPage: async (req, res) => {
        try {
            // Ambil ID kelas yang sedang aktif dari session
            const praktikumId = req.session.idKelasDipilih;

            if (!praktikumId) {
                // Jika tidak ada kelas yang dipilih, arahkan ke dashboard
                return res.redirect('/dashboard-kelas');
            }

            // Ambil detail praktikum untuk header dan navigasi
            const praktikum = await prisma.praktikum.findUnique({
                where: { id: praktikumId },
                include: { lab: true } // Sertakan info lab untuk sidebar
            });

            if (!praktikum) {
                return res.status(404).send('Praktikum tidak ditemukan.');
            }

            // Ambil semua jadwal untuk praktikum ini dari database
            const jadwalFromDb = await prisma.jadwal.findMany({
                where: { praktikum_id: praktikumId },
                orderBy: { tanggal: 'asc' }
            });

            // Format data agar mudah ditampilkan di EJS
            const daftarJadwal = jadwalFromDb.map((item, index) => {
                const tanggal = new Date(item.tanggal);
                return {
                    ...item,
                    pertemuan: `Pertemuan ${index + 1}`,
                    tanggal_formatted: tanggal.toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    }),
                    // Asumsi kolom 'jam' berisi 'HH:MM:SS-HH:MM:SS'
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

    // Fungsi lain untuk asisten (create, update, delete) bisa ditambahkan di sini
};

module.exports = jadwalMahasiswaController;
