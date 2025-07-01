const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPengumumanMahasiswa = async (req, res) => {
    try {
        // Membaca dari 'idKelasDipilih' sesuai dengan yang di-set oleh kelas.controller.js
        const activePraktikumId = req.session.idKelasDipilih; 
        
        console.log('MEMBACA SESSION DI /pengumuman-mahasiswa:', { 
            idKelasDipilih: req.session.idKelasDipilih
        });

        if (!activePraktikumId) {
            // Jika tidak ada kelas aktif, tampilkan error.
            return res.render('pengumumanMahasiswa', {
                title: 'Pengumuman',
                currentPage: 'pengumuman',
                pengumumanList: [],
                user: req.session.user,
                error: 'Pilih kelas praktikum terlebih dahulu dari dashboard untuk melihat pengumuman.'
            });
        }

        // Ambil data pengumuman DAN detail praktikum secara bersamaan
        const [announcements, praktikumDetails] = await Promise.all([
            prisma.pengumuman.findMany({
                where: {
                    praktikum_id: Number(activePraktikumId)
                },
                include: {
                    pembuat: { 
                        select: {
                            // --- PERBAIKAN DI SINI ---
                            // Mengganti 'nama' menjadi 'username' sesuai dengan model User Anda.
                            username: true
                            // --- AKHIR PERBAIKAN ---
                        }
                    }
                },
                orderBy: {
                    dibuat_pada: 'desc'
                }
            }),
            prisma.praktikum.findUnique({ // Ambil detail kelas untuk sidebar
                where: {
                    id: Number(activePraktikumId)
                },
                include: {
                    lab: true
                }
            })
        ]);
        
        const pengumumanList = announcements.map(p => ({
            isi: p.isi,
            dibuat_pada: p.dibuat_pada,
            // --- PERBAIKAN DI SINI ---
            // Mengganti 'p.pembuat.nama' menjadi 'p.pembuat.username'.
            pengirim_nama: p.pembuat ? p.pembuat.username : 'User tidak diketahui'
            // --- AKHIR PERBAIKAN ---
        }));

        // Render halaman dengan semua data yang diperlukan
        res.render('pengumumanMahasiswa', {
            title: 'Pengumuman',
            currentPage: 'pengumuman',
            pengumumanList,
            user: req.session.user,
            praktikum: praktikumDetails // Kirim detail praktikum ke view untuk sidebar
        });

    } catch (error) {
        console.error("❌ Error fetching announcements:", error);
        res.status(500).send("Terjadi kesalahan pada server saat memuat pengumuman.");
    }
};
