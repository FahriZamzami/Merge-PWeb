// src/controllers/jadwal.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Menampilkan halaman daftar jadwal & form
const getJadwalPage = async (req, res) => {
    try {
        const praktikumId = parseInt(req.params.praktikum_id, 10);

        const praktikum = await prisma.praktikum.findUnique({
            where: { id: praktikumId },
        });

        if (!praktikum) {
            return res.status(404).send('Praktikum tidak ditemukan');
        }

        const jadwalList = await prisma.jadwal.findMany({
            where: { praktikum_id: praktikumId },
            orderBy: { tanggal: 'asc' },
        });

        res.render('jadwalPraktikum', {
            title: `Jadwal Praktikum - ${praktikum.nama_praktikum}`,
            praktikum,
            jadwalList,
        });
    } catch (error) {
        console.error('Error fetching jadwal page:', error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

// Membuat jadwal baru
const createJadwal = async (req, res) => {
    try {
        const { praktikum_id, tanggal, jam, materi, ruangan, nama_pengajar } = req.body;
        
        // Gabungkan tanggal dan jam menjadi satu objek DateTime yang valid untuk Prisma
        // Contoh: '2025-06-25' dan '14:00' menjadi '2025-06-25T14:00:00.000Z'
        const tanggalISO = new Date(`${tanggal}T${jam}`);

        await prisma.jadwal.create({
            data: {
                praktikum_id: parseInt(praktikum_id, 10),
                tanggal: tanggalISO,
                jam: tanggalISO, // Kolom 'jam' juga diisi dengan ISO string yang sama
                materi,
                ruangan,
                nama_pengajar,
            },
        });

        res.redirect(`/praktikum/${praktikum_id}/jadwal`);
    } catch (error) {
        console.error('Error creating jadwal:', error);
        res.status(500).send('Gagal membuat jadwal');
    }
};

// Mengambil data satu jadwal untuk form edit (API Endpoint)
const getJadwalById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const jadwal = await prisma.jadwal.findUnique({
            where: { id },
        });
        if (!jadwal) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }
        res.json(jadwal);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data jadwal' });
    }
};


// Memperbarui jadwal
const updateJadwal = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { praktikum_id, tanggal, jam, materi, ruangan, nama_pengajar } = req.body;

        const tanggalISO = new Date(`${tanggal}T${jam}`);

        await prisma.jadwal.update({
            where: { id },
            data: {
                tanggal: tanggalISO,
                jam: tanggalISO,
                materi,
                ruangan,
                nama_pengajar,
            },
        });

        res.redirect(`/praktikum/${praktikum_id}/jadwal`);
    } catch (error) {
        console.error('Error updating jadwal:', error);
        res.status(500).send('Gagal memperbarui jadwal');
    }
};

// Menghapus jadwal
const deleteJadwal = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        
        // Cari dulu jadwalnya untuk mendapatkan praktikum_id agar bisa redirect
        const jadwal = await prisma.jadwal.findUnique({ where: { id } });
        if (!jadwal) {
            return res.status(404).send('Jadwal tidak ditemukan');
        }

        await prisma.jadwal.delete({
            where: { id },
        });

        res.redirect(`/praktikum/${jadwal.praktikum_id}/jadwal`);
    } catch (error) {
        console.error('Error deleting jadwal:', error);
        res.status(500).send('Gagal menghapus jadwal');
    }
};

const toggleJadwalStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const jadwal = await prisma.jadwal.findUnique({ where: { id } });

        if (!jadwal) {
            return res.status(404).send('Jadwal tidak ditemukan');
        }

        const newStatus = jadwal.status === 'Selesai' ? 'Belum_Mulai' : 'Selesai';

        await prisma.jadwal.update({
            where: { id },
            data: { status: newStatus },
        });

        res.redirect(`/praktikum/${jadwal.praktikum_id}/jadwal`);
    } catch (error) {
        console.error('Error toggling jadwal status:', error);
        res.status(500).send('Gagal mengubah status jadwal');
    }
};

// Menampilkan halaman jadwal untuk semua praktikum dalam satu lab
const getJadwalLabPage = async (req, res) => {
    try {
        const labId = parseInt(req.params.lab_id, 10);
        const user = req.session.user;

        const lab = await prisma.lab.findUnique({
            where: { id: labId },
        });

        if (!lab) {
            return res.status(404).send('Lab tidak ditemukan');
        }
        
        // Otorisasi untuk asisten
        if (user.peran?.toLowerCase() === 'asisten') {
            const asistenLab = await prisma.asistenLab.findFirst({
                where: { user_id: user.id, lab_id: labId }
            });

            if (!asistenLab) {
                return res.status(403).send('Anda tidak memiliki akses ke jadwal lab ini.');
            }
        }

        const jadwalList = await prisma.jadwal.findMany({
            where: {
                praktikum: {
                    lab_id: labId,
                },
            },
            include: {
                praktikum: {
                    select: {
                        nama_praktikum: true,
                    }
                }
            },
            orderBy: [{ praktikum: { nama_praktikum: 'asc' } }, { tanggal: 'asc' }],
        });

        res.render('jadwalLab', {
            title: `Jadwal Lab - ${lab.nama_lab}`,
            lab,
            jadwalList,
            user,
        });
    } catch (error) {
        console.error('Error fetching lab jadwal page:', error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};

module.exports = {
    getJadwalPage,
    createJadwal,
    getJadwalById,
    updateJadwal,
    deleteJadwal,
    toggleJadwalStatus,
    getJadwalLabPage,
};