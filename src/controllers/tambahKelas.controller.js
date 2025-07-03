const prisma = require('../../prisma/client');

// Menampilkan halaman tambah kelas
const showTambahKelasPage = async (req, res) => {
    try {
        const labs = await prisma.lab.findMany();
        res.render('tambahKelas', { labs });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).send('Terjadi kesalahan server');
    }
};

// Membuat kelas/praktikum baru
const createKelas = async (req, res) => {
    try {
        const { nama_praktikum, kode_masuk, lab_id } = req.body;
        if (!nama_praktikum || !kode_masuk || !lab_id) {
            return res.status(400).send('Semua field harus diisi');
        }
        const existingPraktikum = await prisma.praktikum.findUnique({ where: { kode_masuk } });
        if (existingPraktikum) {
            return res.status(400).send('Kode masuk sudah digunakan');
        }
        await prisma.praktikum.create({
            data: {
                nama_praktikum,
                kode_masuk,
                lab_id: parseInt(lab_id)
            }
        });
        res.redirect('/lab?success=Kelas berhasil ditambahkan');
    } catch (error) {
        console.error('Error creating praktikum:', error);
        res.status(500).send('Terjadi kesalahan server: ' + error.message);
    }
};

// Menampilkan halaman edit kelas
const showEditKelasPage = async (req, res) => {
    try {
        const kelasId = parseInt(req.params.id);
        const praktikum = await prisma.praktikum.findUnique({
            where: { id: kelasId }
        });
        if (!praktikum) {
            return res.status(404).send('Kelas tidak ditemukan');
        }
        const labs = await prisma.lab.findMany();
        res.render('editKelas', { praktikum, labs });
    } catch (error) {
        console.error('Error showing edit page:', error);
        res.status(500).send('Terjadi kesalahan server');
    }
};

// Mengupdate data kelas
const updateKelas = async (req, res) => {
    try {
        const kelasId = parseInt(req.params.id);
        const { nama_praktikum, kode_masuk, lab_id } = req.body;
        await prisma.praktikum.update({
            where: { id: kelasId },
            data: {
                nama_praktikum,
                kode_masuk,
                lab_id: parseInt(lab_id)
            }
        });
        res.redirect('/lab?success=Kelas berhasil diperbarui');
    } catch (error) {
        console.error('Error updating kelas:', error);
        res.status(500).send('Terjadi kesalahan server');
    }
};

// Menghapus kelas
const deleteKelas = async (req, res) => {
    try {
        const kelasId = parseInt(req.params.id);
        await prisma.praktikum.delete({
            where: { id: kelasId }
        });
        res.redirect('/lab?success=Kelas berhasil dihapus');
    } catch (error) {
        console.error('Error deleting kelas:', error);
        res.status(500).send('Terjadi kesalahan server');
    }
};

module.exports = {
    showTambahKelasPage,
    createKelas,
    showEditKelasPage,
    updateKelas,
    deleteKelas
}; 