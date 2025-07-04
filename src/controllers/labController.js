

const prisma = require('../lib/prisma');

exports.getLabDetail = async (req, res) => {
  try {
    const labId = parseInt(req.params.id); // ID lab sekarang adalah Integer

    const labData = await prisma.lab.findUnique({
      where: { id: labId },
      include: {

        asistenLab: {
          include: {
            user: true // Ambil detail data user yang menjadi asisten
          }
        },

        praktikum: {
          include: {
            mahasiswa: {
              include: {
                user: true // Ambil detail data user yang menjadi mahasiswa
              }
            },
            _count: { // Hitung jumlah modul & tugas
                select: { modul: true, tugas: true }
            }
          }
        }
      }
    });

    if (!labData) {
      return res.status(404).render('404', { title: 'Lab Tidak Ditemukan' });
    }




    const asisten = labData.asistenLab.map(aslab => aslab.user.fullName);
    

    const mahasiswa = labData.praktikum.flatMap(p => p.mahasiswa.map(mhs => mhs.user.fullName));
    const uniqueMahasiswa = [...new Set(mahasiswa)]; // Menghapus duplikat jika ada


    const jumlahModul = labData.praktikum.reduce((sum, p) => sum + p._count.modul, 0);
    const jumlahKelas = labData.praktikum.length;

    const viewData = {
      id: labData.id,
      nama: labData.nama_lab, // Sesuaikan dengan nama field di skema
      icon: '🧪', // Ikon bisa disimpan di DB atau di-hardcode
      deskripsi: 'Deskripsi detail untuk ' + labData.nama_lab, // Deskripsi bisa dari DB
      jadwal: 'Jadwal detail untuk ' + labData.nama_lab, // Jadwal bisa dari DB
      dosen: 'Dosen PJ untuk ' + labData.nama_lab, // Dosen bisa dari DB
      jumlahAsisten: asisten.length,
      jumlahModul: jumlahModul,
      jumlahKelas: jumlahKelas,
      asisten: asisten,
      mahasiswa: uniqueMahasiswa
    };

    res.render('detail-lab', {
      title: `Detail ${viewData.nama}`,
      lab: viewData
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Gagal mengambil data detail lab");
  }
};  