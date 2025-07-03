// src/controllers/mahasiswa.controller.js
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = new PrismaClient();

// Menampilkan halaman daftar mahasiswa dalam satu praktikum
const getDaftarMahasiswaPage = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);
        const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        // Ambil daftar mahasiswa dan sertakan data user (untuk nama & nim)
        const mahasiswaList = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: {
                user: {
                    select: {
                        id: true, // NIM
                        username: true // Nama
                    }
                }
            },
            orderBy: { user: { id: 'asc' } } // Urutkan berdasarkan NIM
        });

        res.render('daftarMahasiswa', {
            title: `Daftar Mahasiswa - ${praktikum.nama_praktikum}`,
            praktikum,
            mahasiswaList,
        });
    } catch (error) {
        console.error("Error fetching mahasiswa list:", error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

// Export daftar mahasiswa ke Excel
const exportDaftarMahasiswaExcel = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);
        const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        const mahasiswaList = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { user: { id: 'asc' } }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Daftar Mahasiswa ${praktikum.nama_praktikum}`);

        // Definisikan header kolom
        const columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'NIM', key: 'nim', width: 15 },
            { header: 'Nama Mahasiswa', key: 'nama', width: 40 },
            { header: 'Waktu Daftar', key: 'waktuDaftar', width: 25 }
        ];
        
        worksheet.columns = columns;

        // Tambahkan data
        mahasiswaList.forEach((mhs, index) => {
            worksheet.addRow({
                no: index + 1,
                nim: mhs.user.id,
                nama: mhs.user.username,
                waktuDaftar: mhs.waktu_daftar ? new Date(mhs.waktu_daftar).toLocaleString('id-ID') : '-'
            });
        });

        // Set header response
        const safeFileName = `Daftar_Mahasiswa_${praktikum.nama_praktikum.replace(/\s+/g, '_')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);

        await workbook.xlsx.write(res);

    } catch (error) {
        console.error("Error exporting Excel:", error);
        res.status(500).send(error.message);
    }
};

// Export daftar mahasiswa ke PDF
const exportDaftarMahasiswaPDF = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);
        const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        const mahasiswaList = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { user: { id: 'asc' } }
        });

        const margin = 40;
        const fontSize = 10;
        const colPadding = 20;

        const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Waktu Daftar'];
        const dataRows = mahasiswaList.map((mhs, index) => [
            (index + 1).toString(),
            mhs.user.id,
            mhs.user.username,
            mhs.waktu_daftar ? new Date(mhs.waktu_daftar).toLocaleString('id-ID') : '-'
        ]);

        const allRows = [headers, ...dataRows];

        // Hitung lebar kolom dinamis
        const tempDoc = new PDFDocument({ fontSize });
        const colWidths = headers.map((_, colIdx) => {
            let maxWidth = 0;
            allRows.forEach(row => {
                const textWidth = tempDoc.widthOfString(row[colIdx].toString(), { fontSize });
                if (textWidth > maxWidth) maxWidth = textWidth;
            });
            return Math.max(30, maxWidth + colPadding);
        });

        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const pageHeight = 595.28;
        const pageWidth = totalWidth + margin * 2;

        const doc = new PDFDocument({
            size: [pageWidth, pageHeight],
            margins: { top: margin, bottom: margin, left: margin, right: margin }
        });

        const safeFileName = `Daftar_Mahasiswa_${praktikum.nama_praktikum.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        doc.pipe(res);

        // Judul PDF
        doc.fontSize(14).text(`Daftar Mahasiswa Praktikum ${praktikum.nama_praktikum}`, { align: 'center' });

        // Tambahkan waktu dan tanggal sekarang
        const now = new Date();
        const localeTanggal = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const localeWaktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        doc.moveDown(0.3);
        doc.fontSize(10).text(`Dicetak pada: ${localeTanggal} pukul ${localeWaktu}`, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(fontSize);

        // Fungsi untuk menggambar baris header
        const drawHeader = (yPos) => {
            let x = margin;
            doc.font('Helvetica-Bold');
            headers.forEach((text, i) => {
                const colWidth = colWidths[i];
                doc.rect(x, yPos, colWidth, 20).fillAndStroke('#D6EAF8', 'black');
                doc.fillColor('black').text(text, x, yPos + 5, { width: colWidth, align: 'center' });
                x += colWidth;
            });
        };

        let y = doc.y;
        drawHeader(y);
        y += 20;

        // Gambar baris data
        doc.font('Helvetica');
        dataRows.forEach(row => {
            if (y + 18 > pageHeight - margin) {
                doc.addPage({ size: [pageWidth, pageHeight], margins: { top: margin, bottom: margin, left: margin, right: margin }});
                y = margin;
                drawHeader(y);
                y += 20;
            }

            let x = margin;
            row.forEach((text, i) => {
                const colWidth = colWidths[i];
                doc.rect(x, y, colWidth, 18).stroke();
                const align = (i === 0) ? 'center' : (i === 1) ? 'center' : 'left';
                const textX = (align === 'center') ? x : x + 2;
                doc.fillColor('black').text(text.toString(), textX, y + 5, { width: colWidth, align: align });
                x += colWidth;
            });
            y += 18;
        });

        doc.end();

    } catch (error) {
        console.error("Error exporting PDF:", error);
        res.status(500).send(error.message);
    }
};

module.exports = { 
    getDaftarMahasiswaPage,
    exportDaftarMahasiswaExcel,
    exportDaftarMahasiswaPDF
};