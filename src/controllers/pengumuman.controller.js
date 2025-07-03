// src/controllers/pengumuman.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Menampilkan halaman daftar pengumuman
const getPengumumanPage = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);
        const praktikum = await prisma.praktikum.findUnique({ where: { id: praktikumId } });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        // Ambil daftar pengumuman dan sertakan nama pembuatnya
        const pengumumanList = await prisma.pengumuman.findMany({
            where: { praktikum_id: praktikumId },
            include: {
                pembuat: { // Ini adalah relasi ke model 'user'
                    select: {
                        username: true
                    }
                }
            },
            orderBy: { dibuat_pada: 'desc' } // Tampilkan yang terbaru di atas
        });

        res.render('pengumuman', {
            title: `Pengumuman - ${praktikum.nama_praktikum}`,
            user: req.session.user, // Kirim info user yg login untuk tombol hapus
            praktikum,
            pengumumanList
        });

    } catch (error) {
        console.error("Error fetching pengumuman page:", error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

// Membuat pengumuman baru
const createPengumuman = async (req, res) => {
    try {
        const { praktikum_id, isi } = req.body;
        const userId = req.session.user.id; // Ambil ID user yang sedang login

        if (!isi || isi.trim() === '') {
            // Sebaiknya gunakan flash message untuk error handling yang lebih baik
            return res.status(400).send('Isi pengumuman tidak boleh kosong.');
        }

        await prisma.pengumuman.create({
            data: {
                praktikum_id: parseInt(praktikum_id, 10),
                isi,
                dibuat_oleh: userId,
                dibuat_pada: new Date() // Set waktu saat ini
            }
        });

        res.redirect(`/praktikum/${praktikum_id}/pengumuman`);
    } catch (error) {
        console.error("Error creating pengumuman:", error);
        res.status(500).send('Gagal membuat pengumuman');
    }
};

// Menghapus pengumuman
const deletePengumuman = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const user = req.session.user;

        // Cari dulu pengumumannya untuk otorisasi dan redirect
        const pengumuman = await prisma.pengumuman.findUnique({ where: { id } });

        if (!pengumuman) {
            return res.status(404).send('Pengumuman tidak ditemukan');
        }

        // Otorisasi: Hanya pembuat asli atau admin yang bisa menghapus
        if (pengumuman.dibuat_oleh !== user.id && user.peran !== 'admin') {
            return res.status(403).send('Anda tidak punya hak untuk menghapus pengumuman ini.');
        }

        await prisma.pengumuman.delete({ where: { id } });

        res.redirect(`/praktikum/${pengumuman.praktikum_id}/pengumuman`);
    } catch (error) {
        console.error("Error deleting pengumuman:", error);
        res.status(500).send('Gagal menghapus pengumuman');
    }
};


module.exports = {
    getPengumumanPage,
    createPengumuman,
    deletePengumuman
};