const prisma = require('../../prisma/client');
const PDFDocument = require('pdfkit');


const absensiMahasiswaController = {
    /**
     * Menampilkan halaman rekapitulasi absensi untuk mahasiswa yang sedang login.
     */
    getRekapAbsensiMahasiswa: async (req, res) => {
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


            const allJadwal = await prisma.jadwal.findMany({
                where: { praktikum_id: praktikumId },
                orderBy: { tanggal: 'asc' }
            });


            const allAbsensi = await prisma.absensi.findMany({
                where: {
                    user_id: user.id,
                    jadwal: {
                        praktikum_id: praktikumId
                    }
                },
                select: {
                    jadwal_id: true,
                    status: true
                }
            });


            const absensiMap = new Map(allAbsensi.map(a => [a.jadwal_id, a.status]));


            const rekapAbsensi = allJadwal.map((jadwal, index) => ({
                pertemuan: `Pertemuan ${index + 1}`,
                materi: jadwal.materi,
                tanggal: new Date(jadwal.tanggal).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                }),
                status: absensiMap.get(jadwal.id) || 'Tidak Tercatat' // Default jika tidak ada data absensi
            }));


            const hadirCount = rekapAbsensi.filter(a => a.status === 'Hadir').length;
            const persentaseKehadiran = allJadwal.length > 0 ? Math.round((hadirCount / allJadwal.length) * 100) : 0;

            res.render('absensiMahasiswa', {
                title: `Rekap Absensi - ${praktikum.nama_praktikum}`,
                praktikum,
                user,
                rekapAbsensi,
                persentaseKehadiran,
                totalPertemuan: allJadwal.length,
                currentPage: 'rekapAbsensi'
            });

        } catch (error) {
            console.error("❌ Error saat mengambil rekap absensi:", error);
            res.status(500).send("Terjadi kesalahan pada server.");
        }
    },

    exportAbsensiMahasiswaPDF: async (req, res) => {
        try {
            const praktikumId = req.session.idKelasDipilih;
            const user = req.session.user;
            if (!praktikumId) return res.redirect('/dashboard-kelas');


            const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });
            const allJadwal = await prisma.jadwal.findMany({ where: { praktikum_id: praktikumId }, orderBy: { tanggal: 'asc' } });
            const allAbsensi = await prisma.absensi.findMany({ where: { user_id: user.id, jadwal: { praktikum_id: praktikumId } } });
            const absensiMap = new Map(allAbsensi.map(a => [a.jadwal_id, a.status]));
            const rekapAbsensi = allJadwal.map((jadwal, index) => ({
                pertemuan: `Pertemuan ${index + 1}`,
                materi: jadwal.materi,
                tanggal: new Date(jadwal.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
                status: absensiMap.get(jadwal.id) || 'Tidak Tercatat'
            }));


            const doc = new PDFDocument({ size: 'A4', margin: 50 });


            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Rekap-Absensi-${user.username}.pdf`);


            doc.pipe(res);


            doc.fontSize(20).font('Helvetica-Bold').text('Rekapitulasi Kehadiran', { align: 'center' });
            doc.fontSize(14).font('Helvetica').text(praktikum.nama_praktikum, { align: 'center' });
            doc.moveDown(2);
            doc.fontSize(12).font('Helvetica-Bold').text('Nama Mahasiswa:', { continued: true }).font('Helvetica').text(` ${user.username}`);
            doc.moveDown(2);


            const tableTop = doc.y;
            const itemX = 50;
            const materiX = 120;
            const tanggalX = 350;
            const statusX = 480;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Pertemuan', itemX, tableTop);
            doc.text('Materi', materiX, tableTop);
            doc.text('Tanggal', tanggalX, tableTop);
            doc.text('Status', statusX, tableTop);
            doc.moveTo(itemX, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();


            doc.fontSize(10).font('Helvetica');
            rekapAbsensi.forEach(item => {
                const y = doc.y;
                doc.text(item.pertemuan, itemX, y);
                doc.text(item.materi, materiX, y, { width: 220 });
                doc.text(item.tanggal, tanggalX, y);
                doc.text(item.status, statusX, y);
                doc.moveDown();
            });


            doc.end();

        } catch (error) {
            console.error("❌ Error saat membuat PDF absensi:", error);
            res.status(500).send("Gagal membuat laporan PDF absensi.");
        }
    }
};

module.exports = absensiMahasiswaController;
