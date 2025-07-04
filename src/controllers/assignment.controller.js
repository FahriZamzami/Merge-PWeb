const prisma = require('../../prisma/client');
const path = require('path');
const fs = require('fs');

const createAssignment = async (req, res) => {
    try {
        const { judul, deskripsi, tanggal, jam, otomatis } = req.body;

        console.log('📅 tanggal:', tanggal);
        console.log('⏰ jam:', jam);


        const dateStr = `${tanggal}T${jam}`;
        console.log('🧪 dateStr:', dateStr);

        const parsedDate = new Date(dateStr);
        console.log('🎯 parsedDate:', parsedDate);
        console.log('🧯 getTime:', parsedDate.getTime());

        if (isNaN(parsedDate.getTime())) {
            return res.status(400).send('Format tanggal/jam tidak valid.');
        }

        const batas_waktu = parsedDate;

        const praktikum_id = parseInt(req.body.praktikum_id || req.session.idKelasDipilih);
        let fileTugas = null;

        if (req.file) {
            fileTugas = req.file.filename;
        }

        await prisma.tugas.create({
            data: {
                praktikum_id,
                judul,
                deskripsi,
                fileTugas,
                batas_waktu,
                tutup_penugasan: otomatis === 'on'
            },
        });

        res.redirect('/assignments');
    } catch (error) {
        console.error('🛑 ERROR SAAT CREATE ASSIGNMENT:', error);
        res.status(500).json({ error: 'Gagal membuat assignment' });
    }
};

const autoCloseAssignments = async () => {
    try {
        const now = new Date();

        await prisma.tugas.updateMany({
            where: {
                tutup_penugasan: true,
                status: 'open',
                batas_waktu: {
                    lt: now
                }
            },
            data: {
                status: 'close'
            }
        });

        console.log('✅ Penugasan otomatis ditutup.');
    } catch (err) {
        console.error('❌ Gagal menutup penugasan otomatis:', err);
    }
};

const getAllAssignments = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.id || req.session.idKelasDipilih);

        if (!praktikumId) {
            return res.status(400).send("ID kelas belum dipilih.");
        }

        req.session.idKelasDipilih = praktikumId;

        const assignments = await prisma.tugas.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { dibuat_pada: 'asc' }
        });

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikumId }
        });

        res.render('daftarAssignments', {
            assignments,
            user: req.session.user,
            praktikum 
        });
    } catch (error) {
        console.error('Gagal mengambil assignment:', error);
        res.status(500).send('Terjadi kesalahan.');
    }
};

const toggleStatusAssignments = async (req, res) => {
    const { id } = req.params;

    try {
        const tugas = await prisma.tugas.findUnique({ where: { id: Number(id) } });

        if (!tugas) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan' });
        }

        const statusBaru = tugas.status === 'open' ? 'close' : 'open';

        await prisma.tugas.update({
            where: { id: Number(id) },
            data: { status: statusBaru },
        });

        return res.json({ success: true, status: statusBaru });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const editAssignmentForm = async (req, res) => {
    const id = Number(req.params.id);
    const assignment = await prisma.tugas.findUnique({ where: { id } });

    if (!assignment) return res.status(404).send('Penugasan tidak ditemukan');

    console.log("🧪 tutup_penugasan dari DB:", assignment.tutup_penugasan); 

    const praktikum = await prisma.praktikum.findUnique({
        where: { id: assignment.praktikum_id }
    });

    const batasWaktu = new Date(assignment.batas_waktu);
    const tgl = batasWaktu.toISOString().split('T')[0];
    const jam = batasWaktu.toTimeString().slice(0, 5);

    res.render('editAssignment', {
        assignment,
        praktikum,
        tgl,
        jam
    });

};

const updateAssignment = async (req, res) => {
    const id = Number(req.params.id);
    const { judul, deskripsi, tanggal, jam, otomatis } = req.body;

    const dateStr = `${tanggal}T${jam}`;
    const parsedDate = new Date(dateStr);

    if (isNaN(parsedDate.getTime())) {
        return res.status(400).send('Format tanggal/jam tidak valid.');
    }

    const batas_waktu = parsedDate;
    let fileTugas = req.file ? req.file.filename : undefined;

    if (req.body.hapusFile === 'true') {
        const old = await prisma.tugas.findUnique({ where: { id } });
        if (old?.fileTugas) {
            const oldPath = path.join(__dirname, '../../public/uploads', old.fileTugas);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        fileTugas = null;
    }

    try {
        if (fileTugas && req.file) {
            const old = await prisma.tugas.findUnique({ where: { id } });
            if (old?.fileTugas) {
                const oldPath = path.join(__dirname, '../../public/uploads', old.fileTugas);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        await prisma.tugas.update({
            where: { id },
            data: {
                judul,
                deskripsi,
                batas_waktu,
                tutup_penugasan: otomatis === 'on',
                fileTugas: typeof fileTugas !== 'undefined' ? fileTugas : undefined
            }
        });

        res.redirect(`/penugasan/detail/${id}`);
    } catch (err) {
        console.error('Gagal update assignment:', err);
        res.status(500).send('Gagal memperbarui assignment.');
    }
};

const deleteAssignment = async (req, res) => {
    const id = Number(req.params.id);
    const assignment = await prisma.tugas.delete({ where: { id } });
    res.redirect(`/assignments`); 
};

const detailAssignment = async (req, res) => {
    const id = Number(req.params.id);

    try {
        const assignment = await prisma.tugas.findUnique({ where: { id } });

        if (!assignment) return res.status(404).send('Penugasan tidak ditemukan');

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: assignment.praktikum_id }
        });

        let submission = null;
        if (req.session.user?.id) {
            submission = await prisma.pengumpulan.findFirst({
                where: {
                    tugas_id: id,
                    user_id: req.session.user.id
                }
            });
        }

        res.render('detailAssignment', {
            assignment: {
                ...assignment,
                nama_file: assignment.fileTugas,
                path_file: assignment.fileTugas
            },
            praktikum,
            submission
        });
    } catch (error) {
        console.error('❌ Gagal render detail penugasan:', error);
        res.status(500).send('Terjadi kesalahan');
    }
};

const getPengumpulanByTugasId = async (req, res) => {
    const tugasId = Number(req.params.id);

    try {
        const assignment = await prisma.tugas.findUnique({
            where: { id: tugasId }
        });

        if (!assignment) return res.status(404).send('Tugas tidak ditemukan');

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: assignment.praktikum_id }
        });

        const submissions = await prisma.pengumpulan.findMany({
            where: { tugas_id: tugasId },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: {
                waktu_kirim: 'desc'
            }
        });

        const formatted = submissions.map(sub => {
            const waktu = new Date(sub.waktu_kirim);
            return {
                ...sub,
                hari: waktu.toLocaleDateString('id-ID', { weekday: 'long' }),
                tanggal: waktu.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                jam: waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
            };
        });

        res.render('pengumpulan', {
            assignment,
            praktikum,
            submissions: formatted,
            user: req.session.user,
            activeTab: 'pengumpul'
        });

    } catch (err) {
        console.error('❌ Gagal mengambil data pengumpulan:', err);
        res.status(500).send('Terjadi kesalahan saat mengambil data pengumpulan');
    }
};

const getFilesByTugasId = async (req, res) => {
    const tugasId = Number(req.params.id);

    try {
        const assignment = await prisma.tugas.findUnique({
            where: { id: tugasId }
        });

        if (!assignment) return res.status(404).send('Tugas tidak ditemukan');

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: assignment.praktikum_id }
        });

        const submissions = await prisma.pengumpulan.findMany({
            where: {
                tugas_id: tugasId,
                NOT: { file_path: null } 
            },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: {
                waktu_kirim: 'desc'
            }
        });

        const formatted = submissions.map(sub => ({
            ...sub,
            nama_file: sub.file_path,   
            path_file: sub.file_path,    
            dikumpulkan_pada: sub.waktu_kirim
        }));

        res.render('filePengumpulan', {
            assignment,
            praktikum,
            submissions: formatted,
            user: req.session.user,
            activeTab: 'file'
        });

    } catch (err) {
        console.error('❌ Gagal mengambil file pengumpulan:', err);
        res.status(500).send('Terjadi kesalahan saat mengambil file pengumpulan');
    }
};

const beriNilaiForm = async (req, res) => {
    const pengumpulanId = Number(req.params.id);

    try {
        const pengumpulan = await prisma.pengumpulan.findUnique({
            where: { id: pengumpulanId },
            include: {
                user: true,
                tugas: true
            }
        });

        if (!pengumpulan) return res.status(404).send('Data pengumpulan tidak ditemukan');

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: pengumpulan.tugas.praktikum_id }
        });

        pengumpulan.dikumpulkan_pada = pengumpulan.waktu_kirim;

        pengumpulan.nama_file = pengumpulan.file_path;
        pengumpulan.path_file = pengumpulan.file_path;

        res.render('beriNilai', {
            pengumpulan,
            praktikum,
            user: req.session.user
        });
    } catch (err) {
        console.error('❌ Gagal render form nilai:', err);
        res.status(500).send('Terjadi kesalahan saat mengambil data untuk penilaian');
    }
};

const simpanNilai = async (req, res) => {
    const id = Number(req.params.id);
    const { nilai, catatan } = req.body;

    if (!nilai || isNaN(nilai) || nilai < 0 || nilai > 100) {
        return res.status(400).send('Nilai harus berupa angka antara 0 - 100');
    }

    try {
        const pengumpulan = await prisma.pengumpulan.update({
            where: { id },
            data: {
                nilai: parseFloat(nilai),
                catatan: catatan?.trim() || null
            }
        });

        res.redirect(`/assignments/${pengumpulan.tugas_id}/pengumpulan`);
    } catch (err) {
        console.error('❌ Gagal menyimpan nilai:', err);
        res.status(500).send('Gagal menyimpan nilai');
    }
};

const hapusFile = async (req, res) => {
    const { id } = req.params;

    try {
        const tugas = await prisma.tugas.findUnique({ where: { id: parseInt(id) } });

        if (tugas?.fileTugas) {
            const filePath = path.join(__dirname, '../../public/uploads', tugas.fileTugas);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await prisma.tugas.update({
                where: { id: parseInt(id) },
                data: { fileTugas: null },
            });
        }

        res.redirect(`/penugasan/edit/${id}`);
    } catch (error) {
        console.error('Gagal hapus file:', error);
        res.status(500).send('Terjadi kesalahan saat menghapus file.');
    }
};

const createAssignmentForm = async (req, res) => {
    try {
        const praktikumId = parseInt(req.session.idKelasDipilih);
        if (!praktikumId) {
        return res.status(400).send('Kelas belum dipilih');
        }

        const praktikum = await prisma.praktikum.findUnique({
        where: { id: praktikumId }
        });

        res.render('../views/addAssignment', {
        praktikum,
        user: req.session.userc
        });
    } catch (err) {
        console.error('❌ Gagal render form tambah assignment:', err);
        res.status(500).send('Terjadi kesalahan.');
    }
};

module.exports = {
    createAssignment,
    getAllAssignments,
    toggleStatusAssignments,
    editAssignmentForm,
    updateAssignment,
    deleteAssignment,
    detailAssignment,
    autoCloseAssignments,
    getPengumpulanByTugasId,
    getFilesByTugasId,
    beriNilaiForm,
    simpanNilai,
    hapusFile,
    createAssignmentForm
};