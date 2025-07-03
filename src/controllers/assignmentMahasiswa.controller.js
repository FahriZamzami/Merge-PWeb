const path = require('path');
const fs = require('fs');
const prisma = require('../../prisma/client');

const assignmentMahasiswaController = {
    /**
     * Menampilkan halaman daftar tugas untuk mahasiswa.
     */
    getAllAssignments: async (req, res) => {
        try {
            const praktikumId = req.session.idKelasDipilih;
            const userId = req.session.user.id;

            if (!praktikumId) {
                return res.redirect('/dashboard-kelas');
            }

            const praktikum = await prisma.praktikum.findUnique({
                where: { id: praktikumId },
                include: { lab: true }
            });

            if (!praktikum) {
                return res.status(404).send('Praktikum tidak ditemukan.');
            }

            const submissions = await prisma.pengumpulan.findMany({
                where: {
                    user_id: userId,
                    tugas: { praktikum_id: praktikumId }
                },
                select: { tugas_id: true, nilai: true, file_path: true }
            });

            const submissionsMap = new Map(submissions.map(s => [s.tugas_id, s]));

            const allTugas = await prisma.tugas.findMany({
                where: { praktikum_id: praktikumId },
                orderBy: { batas_waktu: 'asc' }
            });

            const submittedCount = submissions.filter(s => s.file_path).length;
            const pendingCount = allTugas.length - submittedCount;

            const gradedSubmissions = submissions.filter(s => s.nilai !== null);
            const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.nilai, 0);
            const averageScore = gradedSubmissions.length > 0 ? Math.round(totalScore / gradedSubmissions.length) : 0;
            
            const daftarTugas = allTugas.map(tugas => {
                const submission = submissionsMap.get(tugas.id);
                let statusTugas;

                if (submission && submission.file_path) {
                    if (submission.nilai !== null) {
                        statusTugas = `Dinilai: ${submission.nilai}`;
                    } else {
                        statusTugas = 'Belum dinilai';
                    }
                } else {
                    statusTugas = 'Belum dikumpul';
                }

                return {
                    ...tugas,
                    status: statusTugas,
                    batas_waktu_formatted: new Date(tugas.batas_waktu).toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                };
            });

            res.render('tugas', {
                title: `Tugas - ${praktikum.nama_praktikum}`,
                praktikum,
                daftarTugas,
                submittedCount,
                pendingCount,
                averageScore,
                user: req.session.user,
                currentPage: 'tugas', // <-- Sudah benar
                currentPath: req.path
            });

        } catch (error) {
            console.error("❌ Error fetching assignments:", error);
            res.status(500).send("Terjadi kesalahan pada server.");
        }
    },

    /**
     * Menampilkan halaman detail tugas.
     */
    getAssignmentDetail: async (req, res) => {
        try {
            const tugasId = parseInt(req.params.id, 10);
            const userId = req.session.user.id;

            // [FIX] Mengubah query untuk menyertakan data lab
            const tugas = await prisma.tugas.findUnique({
                where: { id: tugasId },
                include: {
                    praktikum: {
                        include: {
                            lab: true // <-- PENTING: Sertakan data lab
                        }
                    }
                }
            });

            if (!tugas) {
                return res.status(404).send('Tugas tidak ditemukan.');
            }
            
            const submission = await prisma.pengumpulan.findFirst({
                where: {
                    tugas_id: tugasId,
                    user_id: userId
                }
            });

            tugas.batas_waktu_formatted = new Date(tugas.batas_waktu).toLocaleString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            res.render('detailTugas', {
                title: `Tugas: ${tugas.judul}`,
                tugas,
                praktikum: tugas.praktikum,
                submittedFile: submission,
                user: req.session.user,
                currentPage: 'tugas' // [FIX] Mengubah 'assignments' menjadi 'tugas'
            });

        } catch (error) {
            console.error("❌ Error saat mengambil detail tugas:", error);
            res.status(500).send("Terjadi kesalahan pada server.");
        }
    },
    
    /**
     * Menangani pengumpulan file tugas dari mahasiswa.
     */
    submitAssignment: async (req, res) => {
        try {
            const tugasId = parseInt(req.params.id, 10);
            const userId = req.session.user.id;

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
            }

            const existingSubmission = await prisma.pengumpulan.findFirst({
                where: { tugas_id: tugasId, user_id: userId }
            });

            if (existingSubmission) {
                const oldFilePath = path.join(process.cwd(), 'public', 'uploads', existingSubmission.file_path);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
                await prisma.pengumpulan.delete({ where: { id: existingSubmission.id } });
            }

            await prisma.pengumpulan.create({
                data: {
                    file_path: req.file.filename,
                    tugas_id: tugasId,
                    user_id: userId,
                }
            });

            res.json({ success: true, message: 'Tugas berhasil dikumpulkan!' });

        } catch (error) {
            console.error("❌ Error submitting assignment:", error);
            res.status(500).json({ success: false, message: 'Gagal mengumpulkan tugas.' });
        }
    },

    /**
     * Menghapus file pengumpulan tugas oleh mahasiswa.
     */
    deleteSubmission: async (req, res) => {
        try {
            const tugasId = parseInt(req.params.id, 10);
            const userId = req.session.user.id;

            const submission = await prisma.pengumpulan.findFirst({
                where: { tugas_id: tugasId, user_id: userId }
            });

            if (!submission) {
                return res.status(404).json({ success: false, message: 'Data pengumpulan tidak ditemukan.' });
            }

            const filePath = path.join(process.cwd(), 'public', 'uploads', submission.file_path);
            
            console.log(`Mencoba menghapus file di: ${filePath}`);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await prisma.pengumpulan.delete({
                where: { id: submission.id }
            });

            res.json({ success: true, message: 'Pengumpulan berhasil dihapus.' });

        } catch (error) {
            console.error("❌ Error saat menghapus pengumpulan:", error);
            res.status(500).json({ success: false, message: 'Gagal menghapus pengumpulan di server.' });
        }
    }
};

module.exports = assignmentMahasiswaController;