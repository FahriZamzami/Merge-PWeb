

const prisma = require('../lib/prisma');


exports.getCreateAnnouncementPage = async (req, res) => {
  try {

    const allPraktikum = await prisma.praktikum.findMany({
        include: { lab: true } // Ambil info lab agar nama lebih jelas
    });

    res.render('buat-pengumuman', {
      title: 'Buat Pengumuman Baru',
      praktikum: allPraktikum // Kirim data praktikum ke EJS
    });
  } catch (error) {
      console.error(error);
      res.status(500).send('Gagal mengambil data praktikum');
  }
};


exports.createAnnouncement = async (req, res) => {


  const authorId = "admin"; // Ganti ini dengan req.user.id dari sistem login Anda


  const { isi, praktikum_id } = req.body; 

  try {
    await prisma.pengumuman.create({
      data: {
        isi: isi,
        praktikum_id: parseInt(praktikum_id),
        dibuat_oleh: authorId, // Ini adalah Foreign Key ke user.id (String)
        dibuat_pada: new Date()
      },
    });
    res.status(201).json({ message: 'Pengumuman berhasil dipublikasikan' });
  } catch (error) {
    console.error("Gagal membuat pengumuman:", error);
    res.status(500).json({ message: 'Gagal mempublikasikan pengumuman' });
  }
};