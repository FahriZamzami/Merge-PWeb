const prisma = require('../../prisma/client');
const { getRekapKehadiranData } = require('./absensi.controller'); // Impor helper kita
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const getStream = require('streamifier');

const tampilkanRekapNilai = async (req, res) => {
    const praktikumId = parseInt(req.params.id); // dari route /kelas/:id/rekap-nilai

    try {
        // 1. Ambil semua mahasiswa yang tergabung dalam praktikum
        const daftarMahasiswa = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: {
                user: {
                    select: { id: true, username: true }
                }
            }
        });

        // 2. Ambil semua tugas berdasarkan praktikum
        const daftarTugas = await prisma.tugas.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { dibuat_pada: 'asc' }
        });

        // 3. Ambil semua pengumpulan dari praktikum tersebut
        const semuaPengumpulan = await prisma.pengumpulan.findMany({
            where: {
                tugas_id: { in: daftarTugas.map(t => t.id) },
                user_id: { in: daftarMahasiswa.map(m => m.user_id) }
            }
        });

        // 4. Strukturkan data nilai
        const rekapMahasiswa = daftarMahasiswa.map(mhs => {
            const nilaiTugas = {};

            daftarTugas.forEach(tugas => {
                const pengumpulan = semuaPengumpulan.find(p =>
                    p.tugas_id === tugas.id && p.user_id === mhs.user_id
                );
                nilaiTugas[tugas.judul] = pengumpulan?.nilai ?? 0;
            });

            const nilaiArray = Object.values(nilaiTugas).filter(n => n != null);
            const rataRata = nilaiArray.length
                ? (nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length)
                : null;

            return {
                nama: mhs.user.username,
                nim: mhs.user.id,
                nilai: nilaiTugas,
                rataRata
            };
        });

        // ⬇️ Tambahkan bagian ini sebelum render
        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikumId }
        });

        // ⬇️ Kirim ke EJS
        res.render('rekapNilai', {
            daftarTugas,
            daftarMahasiswa: rekapMahasiswa,
            praktikum
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan saat mengambil rekap nilai.');
    }
};

const exportRekapExcel = async (req, res) => {
    const praktikumId = parseInt(req.params.id);

    try {
        // ✅ Ambil nama praktikum dulu
        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikumId }
        });
        const namaPraktikum = praktikum?.nama_praktikum || 'Tanpa_Nama';
        const safeFileName = `Rekap_Nilai_Praktikum_${namaPraktikum.replace(/\s+/g, '_')}.xlsx`;

        const mahasiswa = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: { user: true }
        });

        const tugas = await prisma.tugas.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { dibuat_pada: 'asc' }
        });

        const pengumpulan = await prisma.pengumpulan.findMany({
            where: {
                tugas_id: { in: tugas.map(t => t.id) },
                user_id: { in: mahasiswa.map(m => m.user_id) }
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rekap Nilai');

        const header = ['Nama', 'NIM', ...tugas.map(t => t.judul), 'Rata-rata'];
        worksheet.addRow(header);

        mahasiswa.forEach(m => {
            const nilaiTugas = {};
            tugas.forEach(t => {
                const nilai = pengumpulan.find(p =>
                    p.user_id === m.user_id && p.tugas_id === t.id
                )?.nilai ?? 0;
                nilaiTugas[t.judul] = nilai;
            });

            const nilaiArray = Object.values(nilaiTugas);
            const rata = nilaiArray.length
                ? (nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length)
                : 0;

            worksheet.addRow([
                m.user.username,
                m.user.id,
                ...tugas.map(t => nilaiTugas[t.judul]),
                rata.toFixed(2)
            ]);
        });

        // ✅ Harus disetel *sebelum* `workbook.xlsx.write`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);

        // ✅ Jangan pakai `res.end()` di sini
        await workbook.xlsx.write(res);

    } catch (err) {
        console.error('❌ Gagal export Excel:', err);
        res.status(500).send('Gagal membuat file Excel.');
    }
};

const exportRekapPDF = async (req, res) => {
    const praktikumId = parseInt(req.params.id);

    try {
        const mahasiswa = await prisma.mahasiswa.findMany({
            where: { praktikum_id: praktikumId },
            include: { user: true }
        });

        const tugas = await prisma.tugas.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { dibuat_pada: 'asc' }
        });

        const pengumpulan = await prisma.pengumpulan.findMany({
            where: {
                tugas_id: { in: tugas.map(t => t.id) },
                user_id: { in: mahasiswa.map(m => m.user_id) }
            }
        });

        // Ambil nama praktikum
        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikumId }
        });
        const namaPraktikum = praktikum?.nama_praktikum || 'Tanpa Nama';

        const margin = 40;
        const fontSize = 10;
        const colPadding = 20;

        const headers = ['Nama', 'NIM', ...tugas.map(t => t.judul), 'Rata-rata'];
        const dataRows = mahasiswa.map(m => {
            const nilai = {};
            tugas.forEach(t => {
                nilai[t.judul] = pengumpulan.find(p => p.user_id === m.user_id && p.tugas_id === t.id)?.nilai ?? 0;
            });
            const rata = Object.values(nilai).reduce((a, b) => a + b, 0) / (tugas.length || 1);
            return [m.user.username, m.user.id.toString(), ...tugas.map(t => nilai[t.judul].toString()), rata.toFixed(2)];
        });

        const allRows = [headers, ...dataRows];

        const tempDoc = new PDFDocument({ fontSize });
        const colWidths = headers.map((_, colIdx) => {
            let maxWidth = 0;
            allRows.forEach(row => {
                const textWidth = tempDoc.widthOfString(row[colIdx].toString(), { fontSize });
                if (textWidth > maxWidth) maxWidth = textWidth;
            });
            return maxWidth + colPadding;
        });

        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const pageHeight = 595.28;
        const pageWidth = totalWidth + margin * 2;

        const doc = new PDFDocument({
            size: [pageWidth, pageHeight],
            margins: { top: margin, bottom: margin, left: margin, right: margin }
        });

        const safeFileName = `Rekap_Nilai_Praktikum_${namaPraktikum.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${safeFileName}`);
        doc.pipe(res);

        // Judul PDF
        doc.fontSize(14).text(`Rekap Nilai Praktikum ${namaPraktikum}`, { align: 'center' });

        // Tambahkan waktu dan tanggal sekarang
        const now = new Date();
        const localeTanggal = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const localeWaktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        doc.moveDown(0.3);
        doc.fontSize(10).text(`Dicetak pada: ${localeTanggal} pukul ${localeWaktu}`, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(fontSize);

        // Header
        let x = margin;
        let y = doc.y;
        const headerHeight = 20;

        headers.forEach((text, i) => {
            const colWidth = colWidths[i];

            doc
                .rect(x, y, colWidth, headerHeight)
                .fillAndStroke('#D6EAF8', 'black');

            doc
                .fillColor('black')
                .font('Helvetica-Bold')
                .text(text, x + 2, y + 5, {
                    width: colWidth - 4,
                    align: 'center',
                    lineBreak: false
                });

            x += colWidth;
        });

        doc.y = y + headerHeight;
        doc.font('Helvetica');

        dataRows.forEach(row => {
            let x = margin;
            const y = doc.y;
            const rowHeight = 18;

            row.forEach((text, i) => {
                const colWidth = colWidths[i];

                doc.rect(x, y, colWidth, rowHeight).stroke();
                doc.text(text, x + 2, y + 5, {
                    width: colWidth - 4,
                    align: (i === 0 || i === 1) ? 'left' : 'center',
                    lineBreak: false
                });

                x += colWidth;
            });

            doc.y = y + rowHeight;

            if (doc.y + rowHeight > pageHeight - margin) {
                doc.addPage({ size: [pageWidth, pageHeight], margins: { top: margin, bottom: margin, left: margin, right: margin } });

                let xNew = margin;
                const yNew = doc.y;
                headers.forEach((text, i) => {
                    const colWidth = colWidths[i];
                    doc
                        .rect(xNew, yNew, colWidth, headerHeight)
                        .fillAndStroke('#D6EAF8', 'black');
                    doc
                        .fillColor('black')
                        .font('Helvetica-Bold')
                        .text(text, xNew + 2, yNew + 5, {
                            width: colWidth - 4,
                            align: 'center',
                            lineBreak: false
                        });
                    xNew += colWidths[i];
                });

                doc.y = yNew + headerHeight;
                doc.font('Helvetica');
            }
        });

        doc.end();
    } catch (err) {
        console.error('❌ Gagal export PDF:', err);
        res.status(500).send('Gagal membuat file PDF.');
    }
};

// src/controllers/praktikum.controller.js

// ... (impor dan fungsi lain yang sudah ada) ...


// ... (fungsi tampilkanRekapNilai, dll) ...

// FUNGSI BARU UNTUK EKSPOR KEHADIRAN EXCEL
const exportKehadiranExcel = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.id, 10);
        const { praktikum, jadwalList, rekapData } = await getRekapKehadiranData(praktikumId);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Rekap Kehadiran ${praktikum.nama_praktikum}`);

        // Definisikan header kolom
        const columns = [
            { header: 'NIM', key: 'nim', width: 15 },
            { header: 'Nama Mahasiswa', key: 'nama', width: 30 },
        ];
        jadwalList.forEach((jadwal, index) => {
            columns.push({ header: `P${index + 1}`, key: `p${index + 1}`, width: 5 });
        });
        columns.push({ header: 'Total Hadir', key: 'totalHadir', width: 15 });
        columns.push({ header: 'Total Tdk Hadir', key: 'totalTidakHadir', width: 15 });
        
        worksheet.columns = columns;

        // Tambahkan data
        rekapData.forEach(mhs => {
            const row = { nim: mhs.nim, nama: mhs.nama, totalHadir: mhs.totalHadir, totalTidakHadir: mhs.totalTidakHadir };
            mhs.kehadiran.forEach((status, index) => {
                row[`p${index + 1}`] = status === 'Hadir' ? 'v' : (status === 'Tidak_Hadir' ? 'x' : '-');
            });
            worksheet.addRow(row);
        });

        // Set header response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Rekap-Kehadiran-${praktikum.nama_praktikum}.xlsx`);

        await workbook.xlsx.write(res);

    } catch (error) {
        console.error("Error exporting Excel:", error);
        res.status(500).send(error.message);
    }
};

// FUNGSI BARU UNTUK EKSPOR KEHADIRAN PDF
const exportKehadiranPDF = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.id, 10);
        const { praktikum, jadwalList, rekapData } = await getRekapKehadiranData(praktikumId);

        const margin = 40;
        const fontSize = 10;
        const colPadding = 20;

        const headers = ['NIM', 'Nama Mahasiswa', ...jadwalList.map((j, i) => `P${i + 1}`), 'Total Hadir', 'Total Tdk Hadir'];
        const dataRows = rekapData.map(mhs => {
            const kehadiran = mhs.kehadiran.map(status => (status === 'Hadir' ? 'v' : (status === 'Tidak_Hadir' ? 'x' : '-')));
            return [mhs.nim, mhs.nama, ...kehadiran, mhs.totalHadir.toString(), mhs.totalTidakHadir.toString()];
        });

        const allRows = [headers, ...dataRows];

        // Hitung lebar kolom dinamis
        const tempDoc = new PDFDocument({ fontSize });
        const colWidths = headers.map((_, colIdx) => {
            let maxWidth = 0;
            allRows.forEach(row => {
                const textWidth = tempDoc.widthOfString(row[colIdx].toString(), { fontSize });
                if (textWidth > maxWidth) maxWidth = textWidth;
            });
            // Beri padding dan lebar minimum
            return Math.max(30, maxWidth + colPadding); 
        });

        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const pageHeight = 595.28; // A4 portrait height
        const pageWidth = totalWidth > 841.89 ? totalWidth + margin * 2 : 841.89; // A4 landscape width or more

        const doc = new PDFDocument({
            size: [pageWidth, pageHeight],
            margins: { top: margin, bottom: margin, left: margin, right: margin }
        });

        const safeFileName = `Rekap_Kehadiran_${praktikum.nama_praktikum.replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        doc.pipe(res);

        // Judul PDF
        doc.fontSize(14).text(`Rekap Kehadiran Praktikum ${praktikum.nama_praktikum}`, { align: 'center' });

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
                // Atur alignment: Nama dan NIM rata kiri, sisanya rata tengah
                const align = (i < 2) ? 'left' : 'center';
                const textX = (align === 'left') ? x + 2 : x;
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

// ... (sisa fungsi lainnya tidak perlu diubah)
module.exports = {
    tampilkanRekapNilai,
    exportRekapExcel,
    exportRekapPDF,
    exportKehadiranExcel,
    exportKehadiranPDF
};