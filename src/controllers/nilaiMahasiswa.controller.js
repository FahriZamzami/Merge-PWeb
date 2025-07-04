const prisma = require('../../prisma/client');
const PDFDocument = require('pdfkit');
const path = require('path');

const nilaiMahasiswaController = {
    /**
     * Menampilkan halaman rekapitulasi nilai untuk mahasiswa.
     */
    getRekapNilai: async (req, res) => {
        try {
            const praktikumId = req.session.idKelasDipilih;
            const user = req.session.user;

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
                    user_id: user.id,
                    tugas: { praktikum_id: praktikumId }
                },
                include: { tugas: true },
                orderBy: { tugas: { dibuat_pada: 'asc' } }
            });

            const gradedSubmissions = submissions.filter(s => s.nilai !== null);
            const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.nilai, 0);
            const nilaiRataRata = gradedSubmissions.length > 0 ? Math.round(totalScore / gradedSubmissions.length) : 0;
            
            res.render('nilaiMahasiswa', {
                title: `Rekap Nilai - ${praktikum.nama_praktikum}`,
                praktikum,
                user,
                namaMahasiswa: user.username,
                rekapNilai: submissions,
                nilaiRataRata,
                jumlahTugas: gradedSubmissions.length,
                currentPage: 'rekapNilai'
            });

        } catch (error) {
            console.error("❌ Error saat mengambil rekap nilai:", error);
            res.status(500).send("Terjadi kesalahan pada server.");
        }
    },

    /**
     * [FIX] Membuat dan mengirim file PDF rekap nilai menggunakan PDFKit.
     */
    exportRekapPDF: async (req, res) => {
        try {
            const praktikumId = req.session.idKelasDipilih;
            const user = req.session.user;
            if (!praktikumId) return res.redirect('/dashboard-kelas');


            const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });
            const submissions = await prisma.pengumpulan.findMany({
                where: { user_id: user.id, tugas: { praktikum_id: praktikumId } },
                include: { tugas: true },
                orderBy: { tugas: { dibuat_pada: 'asc' } }
            });
            const gradedSubmissions = submissions.filter(s => s.nilai !== null);
            const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.nilai, 0);
            const nilaiRataRata = gradedSubmissions.length > 0 ? Math.round(totalScore / gradedSubmissions.length) : 0;


            const doc = new PDFDocument({ size: 'A4', margin: 50 });


            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Rekap-Nilai-${user.username}.pdf`);


            doc.pipe(res);



            doc.fontSize(20).font('Helvetica-Bold').text('Rekapitulasi Nilai Akademik', { align: 'center' });
            doc.fontSize(14).font('Helvetica').text(praktikum.nama_praktikum, { align: 'center' });
            doc.moveDown(2);


            doc.fontSize(12).font('Helvetica-Bold').text('Nama Mahasiswa:', { continued: true }).font('Helvetica').text(` ${user.username}`);
            doc.font('Helvetica-Bold').text('Nilai Rata-rata:', { continued: true }).font('Helvetica').text(` ${nilaiRataRata}`);
            doc.moveDown(2);


            const tableTop = doc.y;
            const itemX = 50;
            const judulX = 100;
            const waktuX = 350;
            const nilaiX = 500;

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('No.', itemX, tableTop);
            doc.text('Judul Tugas', judulX, tableTop);
            doc.text('Waktu Pengumpulan', waktuX, tableTop);
            doc.text('Nilai', nilaiX, tableTop, { width: 40, align: 'right' });
            doc.moveTo(itemX, doc.y).lineTo(550, doc.y).stroke(); // Garis bawah header
            doc.moveDown();
            

            doc.fontSize(10).font('Helvetica');
            submissions.forEach((item, index) => {
                const y = doc.y;
                doc.text(index + 1, itemX, y);
                doc.text(item.tugas.judul, judulX, y, { width: 240 });
                doc.text(new Date(item.waktu_pengumpulan).toLocaleString('id-ID'), waktuX, y);
                doc.text(item.nilai !== null ? item.nilai.toString() : '-', nilaiX, y, { width: 40, align: 'right' });
                doc.moveDown();
            });


            doc.end();

        } catch (error) {
            console.error("❌ Error saat membuat PDF dengan PDFKit:", error);
            res.status(500).send("Gagal membuat laporan PDF.");
        }
    }
};

module.exports = nilaiMahasiswaController;
