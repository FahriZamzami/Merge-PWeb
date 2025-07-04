const prisma = require('../../prisma/client');

const homeController = {
    /**
     * Menampilkan halaman utama (dashboard) untuk sebuah kelas praktikum yang spesifik.
     * Mengambil ID kelas dari session yang telah diatur saat mahasiswa masuk/memilih kelas.
     */
    getClassHomePage: async (req, res) => {
        try {

            const kelasId = req.session.idKelasDipilih;

            if (!kelasId) {


                return res.redirect('/dashboard-kelas');
            }
            
            const praktikum = await prisma.praktikum.findUnique({
                where: { id: kelasId },
                include: {
                    lab: true // <-- TAMBAHKAN INI
                }
            });

            if (!praktikum) {

                delete req.session.idKelasDipilih;
                return res.status(404).send('Praktikum tidak ditemukan. Silakan pilih kembali dari dashboard.');
            }
            

            res.render('home', {
                praktikum, // Mengirim objek praktikum lengkap ke view
                user: req.session.user,
                currentPage: 'home' // Untuk menandai sidebar aktif
            });

        } catch (err) {
            console.error('❌ Error saat menampilkan halaman utama kelas:', err);
            res.status(500).send('Terjadi kesalahan saat menampilkan halaman kelas.');
        }
    }
};

module.exports = homeController;
