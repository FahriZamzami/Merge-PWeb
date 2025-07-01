const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Inisialisasi Prisma Client untuk berinteraksi dengan database
const prisma = new PrismaClient();

/**
 * Menampilkan halaman modul materi berdasarkan ID praktikum.
 * Mengambil data praktikum dan daftar modul yang terkait.
 */
const getModulPage = async (req, res) => {
    const praktikumId = parseInt(req.params.praktikum_id, 10);

    if (isNaN(praktikumId)) {
        return res.status(400).send('ID Praktikum tidak valid.');
    }

    try {
        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikumId }
        });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }
        
        const modules = await prisma.modul.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { diunggah_pada: 'desc' }
        });

        const announcements = await prisma.pengumuman.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { dibuat_pada: 'desc' },
            include: { pembuat: true } 
        });
        
        res.render('modul', {
            praktikum,
            modules,
            announcements,
            title: `Modul ${praktikum.nama_praktikum}`
        });

    } catch (error) {
        console.error("Error saat mengambil data halaman modul:", error);
        res.status(500).send("Terjadi kesalahan pada server");
    }
};

/**
 * Menangani logika untuk mengunggah file modul baru.
 * Middleware upload diasumsikan sudah berjalan sebelumnya di router.
 */
const uploadModul = async (req, res) => {
    const praktikumId = parseInt(req.params.praktikum_id, 10);
    const { judul } = req.body;

    // Keamanan: Pastikan judul tidak kosong
    if (!judul || judul.trim() === '') {
        // Sebaiknya gunakan flash message untuk pengalaman pengguna yang lebih baik
        return res.status(400).send('Judul modul tidak boleh kosong.');
    }
    
    // Middleware `upload.single('fileModul')` akan menempatkan info file di `req.file`.
    // Jika file tidak ada, proses upload gagal.
    if (!req.file) {
        return res.status(400).send('File modul wajib diisi dan harus berupa format yang diizinkan.');
    }
    
    // Ambil nama file yang sudah dibuat unik oleh Multer
    const filePath = req.file.filename;

    try {
        // Simpan informasi modul ke database menggunakan Prisma
        await prisma.modul.create({
            data: {
                praktikum_id: praktikumId,
                judul: judul,
                file_path: filePath
                // Kolom `diunggah_pada` (timestamp) biasanya diatur otomatis oleh database
            }
        });
        
        // Arahkan kembali pengguna ke halaman modul setelah berhasil
        res.redirect(`/praktikum/${praktikumId}/modul`);

    } catch (error) {
        console.error("Error saat mengunggah modul:", error);
        res.status(500).send("Gagal mengunggah modul ke database.");
    }
};

/**
 * Menangani logika untuk menghapus sebuah modul.
 * Ini termasuk menghapus file fisik dari server dan data dari database.
 */
const deleteModul = async (req, res) => {
    const modulId = parseInt(req.params.modul_id, 10);

    if (isNaN(modulId)) {
        return res.status(400).send('ID Modul tidak valid.');
    }

    try {
        // Langkah 1: Cari data modul di database sebelum dihapus
        // Ini penting untuk mendapatkan file_path (untuk dihapus) dan praktikum_id (untuk redirect)
        const modul = await prisma.modul.findUnique({
            where: { id: modulId }
        });

        if (!modul) {
            return res.status(404).send('Modul yang akan dihapus tidak ditemukan.');
        }

        // Langkah 2: Hapus file fisik dari folder uploads
        const fullPath = path.join(__dirname, '..', '..', 'public', 'uploads', modul.file_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Langkah 3: Hapus data modul dari database
        await prisma.modul.delete({
            where: { id: modulId }
        });

        // Langkah 4: Arahkan pengguna kembali ke halaman modul yang benar
        res.redirect(`/praktikum/${modul.praktikum_id}/modul`);

    } catch (error) {
        console.error("Error saat menghapus modul:", error);
        res.status(500).send("Gagal menghapus modul.");
    }
};

const createPengumuman = async (req, res) => {
    const praktikumId = parseInt(req.params.praktikum_id, 10);
    const { isi } = req.body;
    const userId = req.session.user.id; 

    try {
        await prisma.pengumuman.create({
            data: {
                isi,
                praktikum_id: praktikumId,
                dibuat_oleh: userId,
                dibuat_pada: new Date(),
            }
        });
        res.redirect(`/praktikum/${praktikumId}/modul`);
    } catch (error) {
        console.error("Error membuat pengumuman:", error);
        res.status(500).send("Gagal membuat pengumuman.");
    }
};

const updatePengumuman = async (req, res) => {
    const pengumumanId = parseInt(req.params.id, 10);
    const { isi, praktikum_id } = req.body;

    try {
        await prisma.pengumuman.update({
            where: { id: pengumumanId },
            data: { isi }
        });
        res.redirect(`/praktikum/${praktikum_id}/modul`);
    } catch (error) {
        console.error("Error mengupdate pengumuman:", error);
        res.status(500).send("Gagal mengupdate pengumuman.");
    }
};

const deletePengumuman = async (req, res) => {
    const pengumumanId = parseInt(req.params.id, 10);

    try {
        const pengumuman = await prisma.pengumuman.findUnique({ where: { id: pengumumanId } });
        await prisma.pengumuman.delete({ where: { id: pengumumanId } });
        res.redirect(`/praktikum/${pengumuman.praktikum_id}/modul`);
    } catch (error) {
        console.error("Error menghapus pengumuman:", error);
        res.status(500).send("Gagal menghapus pengumuman.");
    }
};
// Ekspor semua fungsi controller agar bisa digunakan oleh router
module.exports = {
    getModulPage,
    uploadModul,
    deleteModul,
    createPengumuman,
    updatePengumuman,
    deletePengumuman
};