

const prisma = require('../lib/prisma');


exports.getDashboard = async (req, res) => {
  try {

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