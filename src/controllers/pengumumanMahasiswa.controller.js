const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPengumumanMahasiswa = async (req, res) => {
    try {

        const activePraktikumId = req.session.idKelasDipilih; 
        
        console.log('MEMBACA SESSION DI /pengumuman-mahasiswa:', { 
            idKelasDipilih: req.session.idKelasDipilih
        });

        if (!activePraktikumId) {

            return res.render('pengumumanMahasiswa', {
                title: 'Pengumuman',
                currentPage: 'pengumuman',
                pengumumanList: [],
                user: req.session.user,
                error: 'Pilih kelas praktikum terlebih dahulu dari dashboard untuk melihat pengumuman.'
            });
        }


        const [announcements, praktikumDetails] = await Promise.all([
            prisma.pengumuman.findMany({
                where: {
                    praktikum_id: Number(activePraktikumId)
                },
                include: {
                    pembuat: { 
                        select: {


                            username: true

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


            pengirim_nama: p.pembuat ? p.pembuat.username : 'User tidak diketahui'

        }));


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
