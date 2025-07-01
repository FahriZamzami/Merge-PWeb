const prisma = require('../../prisma/client');

const kelasController = {
    getDashboard: async (req, res) => {
        try {
            const currentUser = req.session.user;
            if (!currentUser || currentUser.peran?.toLowerCase() !== 'mahasiswa') {
                return res.redirect('/login');
            }

            const semuaKelas = await prisma.praktikum.findMany({
                include: {
                    lab: {
                        select: {
                            nama_lab: true
                        }
                    }
                }
            });

            const pendaftaranMahasiswa = await prisma.mahasiswa.findMany({
                where: { user_id: currentUser.id },
                select: { praktikum_id: true }
            });
            const idKelasTerdaftar = new Set(pendaftaranMahasiswa.map(p => p.praktikum_id));

            // [FIX] Penanganan untuk lab yang mungkin bernilai null
            const dataKelasLengkap = semuaKelas.map(kelas => ({
                ...kelas,
                lab: { nama_lab: kelas.lab?.nama_lab || 'Lab tidak ditentukan' },
                sudahTerdaftar: idKelasTerdaftar.has(kelas.id)
            }));

            res.render('dashboardKelas', {
                title: 'Dashboard Kelas',
                currentUser: currentUser,
                semuaKelas: dataKelasLengkap
            });

        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            res.status(500).send('Terjadi kesalahan saat memuat dashboard.');
        }
    },

    masukDenganKode: async (req, res) => {
        try {
            const { kodeMasuk } = req.body;
            const currentUser = req.session.user;

            if (!currentUser) {
                return res.status(401).json({ success: false, message: 'Otentikasi diperlukan.' });
            }

            const kelas = await prisma.praktikum.findUnique({
                where: { kode_masuk: kodeMasuk }
            });

            if (!kelas) {
                return res.status(404).json({ success: false, message: 'Kode akses tidak valid.' });
            }

            const sudahTerdaftar = await prisma.mahasiswa.findFirst({
                where: {
                    user_id: currentUser.id,
                    praktikum_id: kelas.id
                }
            });

            if (sudahTerdaftar) {
                return res.status(400).json({ success: false, message: 'Anda sudah terdaftar di kelas ini.' });
            }

            await prisma.mahasiswa.create({
                data: {
                    user_id: currentUser.id,
                    praktikum_id: kelas.id,
                    waktu_daftar: new Date()
                }
            });
            
            req.session.idKelasDipilih = kelas.id;
            res.json({ success: true, redirectUrl: '/home' });

        } catch (error) {
            console.error('❌ Error joining class with code:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
        }
    },

    masukKelasTerdaftar: async (req, res) => {
        try {
            const praktikumId = parseInt(req.params.praktikumId, 10);
            const currentUser = req.session.user;

            if (!currentUser) {
                return res.status(401).json({ success: false, message: 'Otentikasi diperlukan.' });
            }

            const isRegistered = await prisma.mahasiswa.findFirst({
                where: {
                    user_id: currentUser.id,
                    praktikum_id: praktikumId
                }
            });

            if (isRegistered) {
                req.session.idKelasDipilih = praktikumId;
                return res.json({ success: true, redirectUrl: '/home' });
            } else {
                return res.status(403).json({ success: false, message: 'Akses ditolak.' });
            }
        } catch (error) {
            console.error('❌ Error entering registered class:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
        }
    },

    getHomePage: (req, res) => {
        const user = req.session.user;
        if (user && (user.peran?.toLowerCase() === 'asisten' || user.peran?.toLowerCase() === 'admin')) {
            return res.redirect('/lab');
        }
        return res.redirect('/dashboard-kelas');
    },

    logout: (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error("Gagal menghancurkan sesi saat logout:", err);
                return res.status(500).send("Gagal untuk logout.");
            }
            res.clearCookie('connect.sid'); 
            res.redirect('/login');
        });
    }
};

module.exports = kelasController;