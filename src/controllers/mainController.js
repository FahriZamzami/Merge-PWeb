// src/controllers/mainController.js

const prisma = require('../lib/prisma');

// Menampilkan halaman dasbor utama
exports.getDashboard = async (req, res) => {
  try {
    // Ambil semua data lab
    const labs = await prisma.lab.findMany();
    res.render('dashboard', {
      title: 'Dashboard Utama',
      labs: labs,
    });
  } catch (error) {
    console.error("Gagal mengambil data dasbor:", error);
    res.status(500).send('Terjadi error di server');
  }
};