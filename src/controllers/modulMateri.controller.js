const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');


const prisma = new PrismaClient();

const modulController = {
    /**
     * Menampilkan halaman modul materi.
     * Mengambil ID Praktikum dari session.
     */
    getModulPageMahasiswa: async (req, res) => {
        try {
            const praktikumId = req.session.idKelasDipilih;

            if (!praktikumId) {
                return res.redirect('/dashboard-kelas');
            }
            
            const praktikum = await prisma.praktikum.findUnique({
                where: { id: praktikumId },
                include: { lab: true }
            });

            if (!praktikum) {
                return res.status(404).send('Praktikum yang dipilih tidak valid.');
            }


            const moduls = await prisma.modul.findMany({
                where: { praktikum_id: praktikumId },
                orderBy: { diunggah_pada: 'desc' }
            });
            
            const totalDownloads = moduls.length * 7 + 12;


            res.render('modulMateri', {
                title: `Modul Materi - ${praktikum.nama_praktikum}`,
                praktikum,
                moduls,
                totalDownloads,
                user: req.session.user,
                currentPage: 'modul'
            });

        } catch (error) {
            console.error("❌ Error saat mengambil data halaman modul:", error);
            res.status(500).send("Terjadi kesalahan pada server");
        }
    },

    /**
     * Menangani permintaan download file modul.
     */
    downloadModul: async (req, res) => {
        try {
            const modulId = parseInt(req.params.modul_id, 10);
            if (isNaN(modulId)) {
                return res.status(400).send('ID Modul tidak valid.');
            }

            const modul = await prisma.modul.findUnique({
                where: { id: modulId },
            });

            if (!modul) {
                return res.status(404).send('File modul tidak ditemukan di database.');
            }


            const rootDir = process.cwd(); // Mendapatkan direktori utama proyek
            const filePath = path.join(rootDir, 'public', 'uploads', modul.file_path);
            

            console.log(`Mencoba mengunduh file dari path: ${filePath}`);


            if (fs.existsSync(filePath)) {

                res.download(filePath, modul.file_path, (err) => {
                    if (err) {

                        console.error('❌ Error selama transfer file:', err);
                    }
                });
            } else {
                console.error(`File tidak ditemukan di path: ${filePath}`);
                res.status(404).send('File fisik tidak ditemukan di server.');
            }
        } catch (error) {
            console.error('❌ Error pada fungsi downloadModul:', error);
            res.status(500).send('Gagal memproses permintaan unduhan.');
        }
    }
    

};


module.exports = {modulController}