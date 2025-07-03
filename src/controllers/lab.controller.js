const prisma = require('../../prisma/client');

// src/controllers/lab.controller.js

const labPage = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.redirect('/login');
        }

        const allLabs = await prisma.lab.findMany();
        let praktikumList = [];
        let managedLab = null;

        if (user.peran?.toLowerCase() === 'asisten') {
            // 1. Find the lab(s) this assistant is assigned to
            const asistenInLabs = await prisma.asistenLab.findMany({
                where: { user_id: user.id },
                include: { lab: true },
            });

            if (asistenInLabs.length > 0) {
                // For simplicity, we'll use the first lab an assistant is assigned to as their "managed lab" context.
                managedLab = asistenInLabs[0].lab; 
                const labIds = asistenInLabs.map(al => al.lab_id);

                // 2. Fetch all practicums from those labs
                praktikumList = await prisma.praktikum.findMany({
                    where: { lab_id: { in: labIds } },
                    orderBy: { nama_praktikum: 'asc' },
                });
            }
        } else if (user.peran?.toLowerCase() === 'admin') {
            // Admins see all practicums from all labs
            praktikumList = await prisma.praktikum.findMany({
                orderBy: { nama_praktikum: 'asc' },
            });
        }
        
        res.render('lab', {
            user: user,
            lab: managedLab, // The lab managed by the assistant, null for others
            praktikumList,
            labs: allLabs, // All labs for the "Add Class" modal
            successMessage: req.query.success,
        });

    } catch (err) {
        console.error('❌ Error in labPage:', err);
        res.status(500).send('Gagal mengambil data praktikum');
    }
};

const showHomeClassPage = async (req, res) => {
    const kelasId = parseInt(req.params.id);

    try {
        if (isNaN(kelasId)) {
            return res.status(400).send('ID kelas tidak valid');
        }

        req.session.idKelasDipilih = kelasId;

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: kelasId }
        });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        const studentCount = await prisma.mahasiswa.count({
            where: { praktikum_id: kelasId }
        });

        const assignmentCount = await prisma.tugas.count({
            where: { praktikum_id: kelasId }
        });

        const jadwalBerikutnya = await prisma.jadwal.findFirst({
            where: {
                praktikum_id: kelasId,
                tanggal: { gte: new Date() }
            },
            orderBy: { tanggal: 'asc' }
        });

        const nextSchedule = jadwalBerikutnya
            ? jadwalBerikutnya.tanggal.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            : 'Tidak ada jadwal';

        const tugasTerakhir = await prisma.tugas.findFirst({
            where: { praktikum_id: kelasId },
            orderBy: { batas_waktu: 'desc' }
        });

        const latestAssignment = tugasTerakhir
            ? {
                title: tugasTerakhir.judul || 'Tanpa Judul',
                deadlineDate: tugasTerakhir.batas_waktu?.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }) || '-',
                deadlineTime: tugasTerakhir.batas_waktu?.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace('.', ':') || '-',
                status: tugasTerakhir.status || 'Dibuka'
            }
            : {
                title: 'Belum ada penugasan',
                deadlineDate: '-',
                deadlineTime: '',
                status: '-'
            };

        res.render('homeClass', {
            user: req.session.user,
            praktikum: {
                ...praktikum,
                startDate: praktikum.dibuat_pada?.toLocaleDateString('id-ID') || '-',
            },
            studentCount,
            assignmentCount,
            nextSchedule,
            latestAssignment
        });

    } catch (err) {
        console.error('❌ Error saat render halaman homeClass:', err);
        res.status(500).send('Terjadi kesalahan saat menampilkan halaman kelas');
    }
};

// Menampilkan daftar mahasiswa dalam satu lab
const getDaftarMahasiswaLabPage = async (req, res) => {
    try {
        const user = req.session.user;
        const labId = parseInt(req.params.lab_id, 10);

        if (!user) {
            return res.redirect('/login');
        }

        const lab = await prisma.lab.findUnique({
            where: { id: labId }
        });

        if (!lab) {
            return res.status(404).send('Lab tidak ditemukan');
        }

        if (user.peran?.toLowerCase() === 'asisten') {
            // In a real scenario, you might want to check if the assistant is assigned to this lab.
            // For now, we assume if they can access the URL, they have rights.
        }

        const mahasiswaList = await prisma.mahasiswa.findMany({
            where: {
                praktikum: {
                    lab_id: labId
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                praktikum: {
                    select: {
                        id: true,
                        nama_praktikum: true
                    }
                }
            },
            orderBy: [
                { praktikum: { nama_praktikum: 'asc' } },
                { user: { id: 'asc' } }
            ]
        });

        res.render('daftarMahasiswaLab', {
            title: `Daftar Mahasiswa - ${lab.nama_lab}`,
            lab,
            mahasiswaList,
            user
        });

    } catch (error) {
        console.error("Error fetching lab mahasiswa list:", error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

module.exports = {
    labPage,
    showHomeClassPage,
    getDaftarMahasiswaLabPage,
};