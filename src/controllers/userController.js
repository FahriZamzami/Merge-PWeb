// src/controllers/userController.js

const prisma = require('../lib/prisma'); // Pastikan Anda sudah punya file prisma.js di src/lib
const bcrypt = require('bcryptjs');

/**
 * Menampilkan halaman Daftar semua User dari database
 */
exports.getAllUsers = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      orderBy: { dibuat_pada: 'desc' }
    });
    // Mengirim data 'users' ke view 'daftar-user.ejs'
    res.render('daftar-user', { 
      title: 'Manajemen User',
      users: allUsers,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error("Error saat mengambil data user:", error);
    res.status(500).send("Terjadi kesalahan pada server saat mengambil data user.");
  }
};

/**
 * Menampilkan halaman form untuk Tambah User
 */
exports.getAddUserPage = (req, res) => {
  res.render('tambah-user', { 
    title: 'Tambah User Baru',
    layout: 'layouts/main' 
  });
};

/**
 * Menampilkan halaman form untuk Hapus User
 */
exports.getDeleteUserPage = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({
      where: {
        peran: {
          not: 'admin' // Admin tidak bisa dihapus dari daftar
        }
      }
    });
    res.render('hapus-user', { 
      title: 'Hapus User', 
      users: allUsers,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error("Error saat mengambil data user untuk dihapus:", error);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
};


// ======================================================
// === AKSI DATABASE (Dipanggil oleh JavaScript Frontend) ===
// ======================================================

/**
 * AKSI: Menambahkan user baru ke database
 */
exports.addUser = async (req, res) => {
  const { nama, username, password, peran } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        id: username, // Menggunakan username sebagai ID String
        fullName: nama,
        username: username,
        kata_sandi: hashedPassword,
        peran: peran, // Nilai dari form: 'admin', 'mahasiswa', 'asisten'
      }
    });
    res.status(201).json({ message: 'User berhasil ditambahkan!' });
  } catch (error) {
    console.error("Gagal menambahkan user:", error);
    if (error.code === 'P2002') { // Kode error Prisma untuk unique constraint violation
      return res.status(400).json({ message: `Username '${username}' sudah digunakan.` });
    }
    res.status(500).json({ message: 'Gagal menambahkan user di server.' });
  }
};

/**
 * AKSI: Mengupdate user di database
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { nama, username, peran } = req.body;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: nama,
        username: username,
        peran: peran
      }
    });
    res.status(200).json({ message: 'Perubahan berhasil disimpan!' });
  } catch (error) {
    console.error("Gagal mengupdate user:", error);
    res.status(500).json({ message: 'Gagal menyimpan perubahan.' });
  }
};

/**
 * AKSI: Menghapus user dari database
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'User ID tidak ditemukan.' });
    }
    await prisma.user.delete({
      where: { id: userId }
    });
    res.status(200).json({ message: `User @${userId} berhasil dihapus!` });
  } catch (error) {
    console.error("Gagal menghapus user:", error);
    res.status(500).json({ message: 'Gagal menghapus user.' });
  }
};
