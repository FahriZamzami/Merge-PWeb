const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const getKuisPage = async (req, res) => {
    try {
        const praktikum_id = parseInt(req.params.praktikum_id, 10);

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikum_id },
            include: {
                _count: {
                    select: { mahasiswa: true },
                },
            },
        });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        const kuisList = await prisma.kuis.findMany({
            where: {
                praktikum_id: praktikum_id,
            },
            include: {
                _count: {
                    select: {
                        jawaban_kuis: {
                            where: { status: 'selesai' },
                        },
                    },
                },
            },
            orderBy: {
                dibuat_pada: 'desc',
            },
        });

        res.render('kuis', {
            title: `Kuis Praktikum - ${praktikum.nama_praktikum}`,
            kuisList,
            praktikum,
            totalMahasiswa: praktikum._count.mahasiswa,
        });
    } catch (error) {
        console.error('Error getting kuis page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const showTambahKuisPage = async (req, res) => {
    try {
        const praktikum_id = parseInt(req.params.praktikum_id, 10);
        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikum_id },
        });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        res.render('tambahKuis', {
            title: `Tambah Kuis Baru - ${praktikum.nama_praktikum}`,
            praktikum,
        });
    } catch (error) {
        console.error('Error showing add kuis page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const createKuis = async (req, res) => {
    try {
        const { praktikum_id, judul, deskripsi, waktu_mulai, waktu_selesai, durasi_menit } = req.body;

        const newKuis = await prisma.kuis.create({
            data: {
                praktikum_id: parseInt(praktikum_id, 10),
                judul,
                deskripsi,
                waktu_mulai: new Date(waktu_mulai),
                waktu_selesai: new Date(waktu_selesai),
                durasi_menit: parseInt(durasi_menit, 10),
            },
        });

        // Redirect to the page for adding questions to this new kuis
        res.redirect(`/kuis/${newKuis.id}/soal/tambah`);

    } catch (error) {
        console.error('Error creating kuis:', error);
        res.status(500).send('Internal Server Error');
    }
};

const showTambahSoalPage = async (req, res) => {
    try {
        const kuis_id = parseInt(req.params.id, 10);
        const kuis = await prisma.kuis.findUnique({
            where: { id: kuis_id },
            include: { praktikum: true },
        });

        if (!kuis) {
            return res.status(404).send('Kuis tidak ditemukan');
        }

        res.render('tambahSoal', {
            title: `Tambah Soal - ${kuis.judul}`,
            kuis,
            praktikum: kuis.praktikum,
        });
    } catch (error) {
        console.error('Error showing add soal page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const createSoal = async (req, res) => {
    const kuis_id = parseInt(req.params.id, 10);
    const { pertanyaan, tipe, jawaban_benar, action } = req.body;

    try {
        const kuis = await prisma.kuis.findUnique({ where: { id: kuis_id } });
        if (!kuis) return res.status(404).send('Kuis tidak ditemukan');

        const data = {
            kuis_id,
            pertanyaan,
            tipe,
            jawaban_benar: '',
        };

        if (tipe === 'pilihan_ganda') {
            const opsiKeys = Object.keys(req.body).filter(key => key.startsWith('opsi_'));
            const opsiValues = opsiKeys.map(key => req.body[key]);
            
            data.opsi_a = opsiValues[0] || null;
            data.opsi_b = opsiValues[1] || null;
            data.opsi_c = opsiValues[2] || null;
            data.opsi_d = opsiValues[3] || null;
            data.opsi_e = opsiValues[4] || null;

            const indexJawabanBenar = parseInt(jawaban_benar, 10);
            data.jawaban_benar = opsiValues[indexJawabanBenar] || 'Tidak ada jawaban';

        } else if (tipe === 'essay') {
            data.jawaban_benar = '-'; 
        }

        await prisma.pertanyaan.create({ data });

        if (action === 'selesai') {
            res.redirect(`/praktikum/${kuis.praktikum_id}/kuis`);
        } else {
            res.redirect(`/kuis/${kuis_id}/soal/tambah`);
        }

    } catch (error) {
        console.error('Error creating soal:', error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteKuis = async (req, res) => {
    const { id } = req.params;
    try {
        const kuis = await prisma.kuis.findUnique({ where: { id: parseInt(id) } });
        await prisma.kuis.delete({ where: { id: parseInt(id) } });
        res.redirect(`/praktikum/${kuis.praktikum_id}/kuis`);
    } catch (error) {
        console.error('Error deleting kuis:', error);
        res.status(500).send('Internal Server Error');
    }
};

const toggleKuisStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const kuis = await prisma.kuis.findUnique({ where: { id: parseInt(id) } });
        const newStatus = kuis.status === 'aktif' ? 'tidak_aktif' : 'aktif';
        await prisma.kuis.update({
            where: { id: parseInt(id) },
            data: { status: newStatus },
        });
        res.redirect(`/praktikum/${kuis.praktikum_id}/kuis`);
    } catch (error) {
        console.error('Error toggling kuis status:', error);
        res.status(500).send('Internal Server Error');
    }
};

const showEditKuisPage = async (req, res) => {
    try {
        const { id } = req.params;
        const kuis = await prisma.kuis.findUnique({
            where: { id: parseInt(id) },
            include: { praktikum: true },
        });

        if (!kuis) {
            return res.status(404).send('Kuis tidak ditemukan');
        }

        res.render('editKuis', {
            title: `Edit Kuis - ${kuis.judul}`,
            kuis,
            praktikum: kuis.praktikum,
        });
    } catch (error) {
        console.error('Error showing edit kuis page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateKuis = async (req, res) => {
    const { id } = req.params;
    const { praktikum_id, judul, deskripsi, waktu_mulai, waktu_selesai, durasi_menit } = req.body;
    try {
        await prisma.kuis.update({
            where: { id: parseInt(id) },
            data: {
                judul,
                deskripsi,
                waktu_mulai: new Date(waktu_mulai),
                waktu_selesai: new Date(waktu_selesai),
                durasi_menit: parseInt(durasi_menit, 10),
            },
        });
        res.redirect(`/praktikum/${praktikum_id}/kuis`);
    } catch (error) {
        console.error('Error updating kuis:', error);
        res.status(500).send('Internal Server Error');
    }
};

const showDaftarSoalPage = async (req, res) => {
    try {
        const kuis_id = parseInt(req.params.id, 10);
        const kuis = await prisma.kuis.findUnique({
            where: { id: kuis_id },
            include: {
                praktikum: true,
                pertanyaan: {
                    orderBy: { urutan: 'asc' }, // Asumsi ada field 'urutan'
                },
            },
        });

        if (!kuis) {
            return res.status(404).send('Kuis tidak ditemukan');
        }

        res.render('daftarSoal', {
            title: `Daftar Soal - ${kuis.judul}`,
            kuis,
            praktikum: kuis.praktikum,
            soalList: kuis.pertanyaan,
            currentPath: req.path,
        });
    } catch (error) {
        console.error('Error showing daftar soal page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const showNilaiKuisPage = async (req, res) => {
    try {
        const kuis_id = parseInt(req.params.id, 10);
        const kuis = await prisma.kuis.findUnique({
            where: { id: kuis_id },
            include: {
                praktikum: true,
                jawaban_kuis: {
                    where: { status: 'selesai' },
                    include: { user: true },
                    orderBy: { waktu_selesai: 'asc' },
                },
            },
        });

        if (!kuis) {
            return res.status(404).send('Kuis tidak ditemukan');
        }

        // const totalPoinKuis = await prisma.pertanyaan.aggregate({
        //     where: { kuis_id: kuis_id },
        //     _sum: { poin: true },
        // });
        // const maxPoin = totalPoinKuis._sum.poin || 100;

        res.render('nilaiKuis', {
            title: `Nilai Mahasiswa - ${kuis.judul}`,
            kuis,
            praktikum: kuis.praktikum,
            daftarNilai: kuis.jawaban_kuis,
            maxPoin: 100, // Hardcode for debugging
            currentPath: req.path,
        });

    } catch (error) {
        console.error('Error showing nilai kuis page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const exportNilaiExcel = async (req, res) => {
    const kuis_id = parseInt(req.params.id, 10);
    try {
        const kuis = await prisma.kuis.findUnique({
            where: { id: kuis_id },
            include: {
                jawaban_kuis: { where: { status: 'selesai' }, include: { user: true } },
                praktikum: true,
            },
        });

        const safeFileName = `Nilai_${kuis.judul.replace(/\s+/g, '_')}.xlsx`;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Nilai Kuis');

        worksheet.addRow(['Nama', 'NIM', 'Waktu Submit', 'Nilai']);

        kuis.jawaban_kuis.forEach(jawaban => {
            worksheet.addRow([
                jawaban.user.username, 
                jawaban.user.id,
                new Date(jawaban.waktu_selesai).toLocaleString('id-ID'),
                jawaban.total_poin
            ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Gagal export Excel:', error);
        res.status(500).send('Gagal membuat file Excel.');
    }
};

const exportNilaiPDF = async (req, res) => {
    const kuis_id = parseInt(req.params.id, 10);
    try {
        const kuis = await prisma.kuis.findUnique({
            where: { id: kuis_id },
            include: {
                jawaban_kuis: { where: { status: 'selesai' }, include: { user: true } },
                praktikum: true,
            },
        });

        const safeFileName = `Nilai_${kuis.judul.replace(/\s+/g, '_')}.pdf`;

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFileName}`);
        doc.pipe(res);

        doc.fontSize(16).text(`Daftar Nilai Kuis: ${kuis.judul}`, { align: 'center' });
        doc.fontSize(12).text(`Praktikum: ${kuis.praktikum.nama_praktikum}`, { align: 'center' });
        doc.moveDown();

        const tableTop = doc.y;
        const headers = ['Nama', 'NIM', 'Waktu Submit', 'Nilai'];
        const rows = kuis.jawaban_kuis.map(j => [
            j.user.username,
            j.user.id,
            new Date(j.waktu_selesai).toLocaleString('id-ID'),
            j.total_poin.toString()
        ]);

        // Draw table
        const rowHeight = 25;
        const colWidths = [150, 100, 150, 50];

        // Header
        let currentX = 50;
        doc.font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.text(header, currentX, tableTop, { width: colWidths[i] });
            currentX += colWidths[i];
        });
        doc.font('Helvetica');
        let currentY = tableTop + rowHeight;

        // Rows
        rows.forEach(row => {
            currentX = 50;
            row.forEach((cell, i) => {
                doc.text(cell, currentX, currentY, { width: colWidths[i] });
                currentX += colWidths[i];
            });
            currentY += rowHeight;
        });

        doc.end();

    } catch (error) {
        console.error('Gagal export PDF:', error);
        res.status(500).send('Gagal membuat file PDF.');
    }
};

module.exports = {
    getKuisPage,
    showTambahKuisPage,
    createKuis,
    showTambahSoalPage,
    createSoal,
    deleteKuis,
    toggleKuisStatus,
    showEditKuisPage,
    updateKuis,
    showDaftarSoalPage,
    showNilaiKuisPage,
    exportNilaiExcel,
    exportNilaiPDF,
}; 