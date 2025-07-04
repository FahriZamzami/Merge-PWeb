const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

const statusFile = path.join(__dirname, '..', '..', 'status.json');

function getStatusOffline() {
try {
const data = fs.readFileSync(statusFile, 'utf8');
const status = JSON.parse(data);
return status.isOffline;
} catch {
return false;
}
}

async function testDatabaseConnection() {
try {
await prisma.$connect();
console.log('✅ Database connected successfully');
} catch (error) {
console.error('❌ Database connection failed:', error);
}
}

testDatabaseConnection();

router.get('/admin', async (req, res) => {
try {
const labs = await prisma.lab.findMany({
    orderBy: { id: 'asc' }
});

const activeUsers = await prisma.user.count();
const totalAnnouncements = await prisma.pengumuman.count();

const stats = {
    totalLabs: labs.length,
    activeUsers: activeUsers,
    totalAnnouncements: totalAnnouncements
};

res.render('dashboard', { 
    title: 'Dashboard', 
    labs: labs, 
    stats: stats 
});
} catch (error) {
console.error('Error fetching dashboard data:', error);
res.status(500).render('error', { 
    title: 'Error',
    message: 'Gagal mengambil data untuk dashboard.',
    error: error.message 
});
}
});

router.get('/logout', (req, res) => {
res.clearCookie('sessionId');
res.clearCookie('adminSession');

res.redirect('/');
});

router.get('/informasi', async (req, res) => {
try {
const labs = await prisma.lab.findMany({
    orderBy: { id: 'asc' }
});
res.render('informasi', { title: 'Informasi Lab', labs });
} catch (error) {
console.error('Error fetching labs for informasi page:', error);
res.status(500).render('error', { 
    title: 'Error',
    message: 'Gagal mengambil data lab. Pastikan database terhubung dengan benar.',
    error: error.message 
});
}
});

router.get('/user', async (req, res) => {
try {
const users = await prisma.user.findMany({
    orderBy: { dibuat_pada: 'desc' }
});
res.render('user', { title: 'Semua User', users });
} catch (error) {
console.error('Error fetching users:', error);
res.status(500).render('error', { 
    title: 'Error',
    message: 'Gagal mengambil data user. Pastikan database terhubung dengan benar.',
    error: error.message 
});
}
});

router.get('/user/tambah', async (req, res) => {
  const labs = await prisma.lab.findMany({ orderBy: { nama_lab: 'asc' } });
  res.render('user_tambah', { title: 'Tambah User', labs });
});

router.get('/user/hapus', async (req, res) => {
try {
const users = await prisma.user.findMany({
    where: {
    peran: {
        not: 'admin'
    }
    }
});
res.render('user_hapus', { title: 'Hapus User', users });
} catch (error) {
console.error('Error fetching users for deletion:', error);
res.status(500).render('error', { 
    title: 'Error',
    message: 'Gagal mengambil data user. Pastikan database terhubung dengan benar.',
    error: error.message 
});
}
});

router.post('/user/create', async (req, res) => {
  try {
    const { nim, nama, username, password, peran, lab_id } = req.body;

    if (!nim || !nama || !username || !password || !peran || (peran === 'asisten' && !lab_id)) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    const peranLower = peran.toLowerCase();
    if (!['admin', 'mahasiswa', 'asisten'].includes(peranLower)) {
      return res.status(400).json({
        success: false,
        message: 'Peran harus admin, mahasiswa, atau asisten'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: nim },
          { username: username }
        ]
      }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'NIM atau Username sudah digunakan'
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: nim,
          username: username,
          kata_sandi: password,
          peran: peranLower
        }
      });

      if (peranLower === 'asisten') {
        const labIdInt = parseInt(lab_id);
        if (isNaN(labIdInt)) {
          throw new Error('Lab ID tidak valid');
        }
        await tx.asistenLab.create({
          data: {
            user_id: nim,
            lab_id: labIdInt
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'User berhasil ditambahkan',
      user: {
        id: nim,
        username: username,
        peran: peranLower
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    let msg = 'Terjadi kesalahan saat menambah user';
    if (error.message && error.message.includes('Lab ID tidak valid')) {
      msg = 'Lab ID tidak valid atau tidak ditemukan';
    }
    res.status(500).json({
      success: false,
      message: msg
    });
  }
});

router.put('/user/update/:id', async (req, res) => {
try {
const { id } = req.params;
const { username, peran } = req.body;

if (!username || !peran) {
    return res.status(400).json({ 
    success: false, 
    message: 'Semua field harus diisi' 
    });
}

const peranLower = peran.toLowerCase();
if (!['admin', 'mahasiswa', 'asisten'].includes(peranLower)) {
    return res.status(400).json({ 
    success: false, 
    message: 'Peran harus admin, mahasiswa, atau asisten' 
    });
}

const existingUser = await prisma.user.findFirst({
    where: { 
    username: username,
    id: { not: id }
    }
});

if (existingUser) {
    return res.status(400).json({ 
    success: false, 
    message: 'Username sudah digunakan oleh user lain' 
    });
}

const updatedUser = await prisma.user.update({
    where: { id },
    data: {
    username: username,
    peran: peranLower
    }
});

res.json({ 
    success: true, 
    message: 'User berhasil diperbarui',
    user: {
    id: updatedUser.id,
    username: updatedUser.username,
    peran: updatedUser.peran
    }
});
} catch (error) {
console.error('Error updating user:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat memperbarui user' 
});
}
});

router.post('/user/hapus', async (req, res) => {
try {
const { userId } = req.body;

if (!userId) {
    return res.status(400).json({ 
    success: false, 
    message: 'ID user diperlukan' 
    });
}

const user = await prisma.user.findUnique({
    where: { id: userId }
});

if (!user) {
    return res.status(404).json({ 
    success: false, 
    message: 'User tidak ditemukan' 
    });
}

if (user.peran === 'admin') {
    return res.status(403).json({ 
    success: false, 
    message: 'Tidak dapat menghapus user admin' 
    });
}

await prisma.$transaction(async (tx) => {
    await tx.mahasiswa.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.pengumpulan.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.pengumuman.deleteMany({
    where: { dibuat_oleh: userId }
    });
    
    await tx.absensi.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.asistenLab.deleteMany({
    where: { user_id: userId }
    });
    

    await tx.user.delete({
    where: { id: userId }
    });
});

res.json({ 
    success: true, 
    message: 'User berhasil dihapus' 
});
} catch (error) {
console.error('Error deleting user:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat menghapus user' 
});
}
});

router.delete('/user/delete', async (req, res) => {
try {
const { userId } = req.body;

if (!userId) {
    return res.status(400).json({ 
    success: false, 
    message: 'ID user diperlukan' 
    });
}

const user = await prisma.user.findUnique({
    where: { id: userId }
});

if (!user) {
    return res.status(404).json({ 
    success: false, 
    message: 'User tidak ditemukan' 
    });
}

if (user.peran === 'admin') {
    return res.status(403).json({ 
    success: false, 
    message: 'Tidak dapat menghapus user admin' 
    });
}

await prisma.$transaction(async (tx) => {
    await tx.mahasiswa.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.pengumpulan.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.pengumuman.deleteMany({
    where: { dibuat_oleh: userId }
    });
    
    await tx.absensi.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.asistenLab.deleteMany({
    where: { user_id: userId }
    });
    
    await tx.user.delete({
    where: { id: userId }
    });
});

res.json({ 
    success: true, 
    message: 'User berhasil dihapus' 
});
} catch (error) {
console.error('Error deleting user:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat menghapus user' 
});
}
});

router.get('/pengumuman', (req, res) => res.render('pengumumanAdmin', { title: 'Buat Pengumuman' }));

router.get('/pengumuman/list', (req, res) => res.render('pengumuman_list', { title: 'Daftar Pengumuman' }));

router.post('/pengumuman', async (req, res) => {
  try {
    // 1. Ambil data 'isi' dan 'lab_tujuan' dari body request. 'judul' dihapus.
    const { isi, lab_tujuan } = req.body;

    // Validasi input
    if (!isi || !lab_tujuan) {
      return res.status(400).json({ success: false, message: 'Isi pengumuman dan Lab Tujuan harus diisi' });
    }
    
    // Cek sesi admin
    const adminUser = req.session && req.session.user && req.session.user.id ? req.session.user.id : null;
    if (!adminUser) {
      return res.status(401).json({ success: false, message: 'Anda harus login sebagai admin untuk membuat pengumuman' });
    }

    // 2. Logika untuk menentukan target praktikum
    if (lab_tujuan === 'semua') {
      // Jika targetnya "Semua Lab", ambil semua ID praktikum yang ada
      const allPraktikum = await prisma.praktikum.findMany({
        select: { id: true }
      });

      if (allPraktikum.length === 0) {
        return res.status(404).json({ success: false, message: 'Tidak ada data praktikum di database.' });
      }
      
      // Buat data pengumuman untuk setiap praktikum
      const announcementsData = allPraktikum.map(p => ({
        isi: isi,
        praktikum_id: p.id,
        dibuat_oleh: adminUser
      }));

      // Simpan semua pengumuman sekaligus
      await prisma.pengumuman.createMany({
        data: announcementsData
      });

      res.json({ success: true, message: `Pengumuman berhasil dipublikasikan untuk ${allPraktikum.length} praktikum.` });

    } else {
      // Jika targetnya lab spesifik
      // Mapping dari value frontend ke ID di tabel 'lab'
      const labMap = {
        'lbi': 1,
        'labgis': 2,
        'ldkom': 3,
        'lea': 4
      };
      const labId = labMap[lab_tujuan];

      if (!labId) {
        return res.status(400).json({ success: false, message: 'Lab tujuan tidak valid.' });
      }

      // Cari praktikum yang terkait dengan lab_id tersebut
      // Asumsi: kita menargetkan praktikum aktif/terbaru dari lab tersebut. findFirst() cukup.
      const praktikum = await prisma.praktikum.findFirst({
        where: { lab_id: labId }, // Asumsi ada kolom 'lab_id' di tabel 'praktikum'
        orderBy: { id: 'desc' } // Opsional: ambil yang terbaru jika ada banyak
      });

      if (!praktikum) {
        return res.status(404).json({ success: false, message: 'Tidak ditemukan praktikum untuk lab yang dipilih.' });
      }

      // Buat satu pengumuman untuk praktikum yang ditemukan
      const announcement = await prisma.pengumuman.create({
        data: {
          isi: isi, // Langsung gunakan 'isi' tanpa 'judul'
          praktikum_id: praktikum.id, // Gunakan ID praktikum yang ditemukan
          dibuat_oleh: adminUser
        }
      });
      
      res.json({ success: true, message: 'Pengumuman berhasil dipublikasikan', announcement });
    }

  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal saat membuat pengumuman', error: error.message });
  }
});

// router.post('/pengumuman', async (req, res) => {
// try {
// const { judul, isi } = req.body;
// if (!isi) {
//     return res.status(400).json({ success: false, message: 'Isi pengumuman harus diisi' });
// }
// const adminUser = req.session && req.session.user && req.session.user.id ? req.session.user.id : null;
// if (!adminUser) {
//     return res.status(401).json({ success: false, message: 'Anda harus login sebagai admin untuk membuat pengumuman' });
// }
// const fullContent = judul ? `${judul}: ${isi}` : isi;
// const announcement = await prisma.pengumuman.create({
//     data: {
//     isi: fullContent,
//     praktikum_id: 8,
//     dibuat_oleh: adminUser
//     }
// });
// res.json({ success: true, message: 'Pengumuman berhasil dipublikasikan', announcement });
// } catch (error) {
// console.error('Error creating announcement:', error);
// res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuat pengumuman', error: error.message });
// }
// });

router.get('/api/pengumuman', async (req, res) => {
try {
const announcements = await prisma.pengumuman.findMany({
    include: {
    pembuat: {
        select: {
        username: true
        }
    }
    },
    orderBy: {
    dibuat_pada: 'desc'
    }
});
res.json({
    success: true,
    announcements: announcements.map(ann => ({
    id: ann.id,
    isi: ann.isi,
    dibuat_oleh: ann.pembuat?.username || ann.dibuat_oleh,
    dibuat_pada: ann.dibuat_pada
    }))
});
} catch (error) {
console.error('Error fetching announcements:', error);
if (error.meta) {
    console.error('Prisma error meta:', error.meta);
}
res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan saat mengambil pengumuman',
    error: error.message,
    prisma: error.meta || null
});
}
});

router.delete('/api/pengumuman/:id', async (req, res) => {
console.log('DELETE /api/pengumuman/' + req.params.id);
try {
const { id } = req.params;

const announcement = await prisma.pengumuman.findUnique({
    where: { id: parseInt(id) }
});

if (!announcement) {
    return res.status(404).json({ 
    success: false, 
    message: 'Pengumuman tidak ditemukan' 
    });
}

await prisma.pengumuman.delete({
    where: { id: parseInt(id) }
});

res.json({ 
    success: true, 
    message: 'Pengumuman berhasil dihapus' 
});
} catch (error) {
console.error('Error deleting announcement:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat menghapus pengumuman' 
});
}
});

router.get('/api/pengumuman/:lab', async (req, res) => {
try {
const { lab } = req.params;

const announcements = await prisma.pengumuman.findMany({
    include: {
    pembuat: {
        select: {
        username: true
        }
    }
    },
    orderBy: {
    dibuat_pada: 'desc'
    }
});

res.json({
    success: true,
    announcements: announcements.map(ann => ({
    id: ann.id,
    isi: ann.isi,
    dibuat_oleh: ann.pembuat?.username || ann.dibuat_oleh,
    dibuat_pada: ann.dibuat_pada
    }))
});
} catch (error) {
console.error('Error fetching announcements by lab:', error);
res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan saat mengambil pengumuman'
});
}
});


router.post('/api/lab/create', async (req, res) => {
try {
const { nama, fullName, deskripsi, jadwal, dosen } = req.body;

console.log('Received lab data:', { nama, fullName, deskripsi, jadwal, dosen });


if (!nama || !fullName || !deskripsi || !jadwal || !dosen) {
    return res.status(400).json({ 
    success: false, 
    message: 'Semua field harus diisi' 
    });
}


const labNameRegex = /^[A-Z0-9]+$/;
if (!labNameRegex.test(nama)) {
    return res.status(400).json({ 
    success: false, 
    message: 'Nama lab harus berupa huruf kapital dan angka tanpa spasi (contoh: LEA, LABGIS, LBI)' 
    });
}


const existingLab = await prisma.lab.findFirst({
    where: { 
    OR: [
        { nama_lab: nama },
        { nama_lab: fullName }
    ]
    }
});

if (existingLab) {
    return res.status(400).json({ 
    success: false, 
    message: 'Nama lab sudah digunakan' 
    });
}


const newLab = await prisma.lab.create({
    data: {
    nama_lab: nama,
    deskripsi: deskripsi,
    jadwal: jadwal,
    dosen: dosen,
    kapasitas: 30,
    status: 'aktif'
    }
});

console.log('Lab created:', newLab);

res.json({ 
    success: true, 
    message: 'Lab berhasil ditambahkan',
    lab: {
    id: newLab.id,
    nama: newLab.nama_lab,
    deskripsi: newLab.deskripsi,
    jadwal: newLab.jadwal,
    dosen: newLab.dosen
    }
});
} catch (error) {
console.error('Error creating lab:', error);
if (error.meta) {
    console.error('Prisma error meta:', error.meta);
}
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat membuat lab',
    error: error.message,
    prisma: error.meta || null
});
}
});

router.delete('/api/lab/:id', async (req, res) => {
try {
const { id } = req.params;

console.log('Deleting lab with ID:', id);

const lab = await prisma.lab.findUnique({
    where: { id: parseInt(id) }
});

if (!lab) {
    return res.status(404).json({ 
    success: false, 
    message: 'Lab tidak ditemukan' 
    });
}

const relatedData = await prisma.praktikum.findFirst({
    where: { lab_id: parseInt(id) }
});

if (relatedData) {
    return res.status(400).json({ 
    success: false, 
    message: 'Tidak dapat menghapus lab yang memiliki data praktikum terkait' 
    });
}

await prisma.lab.delete({
    where: { id: parseInt(id) }
});

console.log('Lab deleted successfully');

res.json({ 
    success: true, 
    message: 'Lab berhasil dihapus' 
});
} catch (error) {
console.error('Error deleting lab:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat menghapus lab' 
});
}
});

router.put('/api/lab/:id', async (req, res) => {
try {
const { id } = req.params;
const { nama, fullName, deskripsi, jadwal, dosen, kapasitas, status } = req.body;

console.log('Updating lab with ID:', id, 'Data:', req.body);

const existingLab = await prisma.lab.findUnique({
    where: { id: parseInt(id) }
});

if (!existingLab) {
    return res.status(404).json({ 
    success: false, 
    message: 'Lab tidak ditemukan' 
    });
}

if (nama) {
    const labNameRegex = /^[A-Z0-9]+$/;
    if (!labNameRegex.test(nama)) {
    return res.status(400).json({ 
        success: false, 
        message: 'Nama lab harus berupa huruf kapital dan angka tanpa spasi' 
    });
    }
}

if (nama && nama !== existingLab.nama_lab) {
    const nameConflict = await prisma.lab.findFirst({
    where: { 
        nama_lab: nama,
        id: { not: parseInt(id) }
    }
    });

    if (nameConflict) {
    return res.status(400).json({ 
        success: false, 
        message: 'Nama lab sudah digunakan oleh lab lain' 
    });
    }
}

const updatedLab = await prisma.lab.update({
    where: { id: parseInt(id) },
    data: {
    nama_lab: nama || existingLab.nama_lab,
    deskripsi: deskripsi || existingLab.deskripsi,
    jadwal: jadwal || existingLab.jadwal,
    dosen: dosen || existingLab.dosen,
    kapasitas: kapasitas || existingLab.kapasitas,
    status: status || existingLab.status
    }
});

console.log('Lab updated successfully');

res.json({ 
    success: true, 
    message: 'Lab berhasil diperbarui',
    lab: {
    id: updatedLab.id,
    nama: updatedLab.nama_lab,
    deskripsi: updatedLab.deskripsi,
    jadwal: updatedLab.jadwal,
    dosen: updatedLab.dosen,
    kapasitas: updatedLab.kapasitas,
    status: updatedLab.status
    }
});
} catch (error) {
console.error('Error updating lab:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat memperbarui lab' 
});
}
});

router.get('/api/lab', async (req, res) => {
try {
const labs = await prisma.lab.findMany({
    orderBy: {
    id: 'asc'
    }
});

res.json({
    success: true,
    labs: labs.map(lab => ({
    id: lab.id,
    nama: lab.nama_lab,
    deskripsi: lab.deskripsi,
    jadwal: lab.jadwal,
    dosen: lab.dosen,
    kapasitas: lab.kapasitas,
    status: lab.status
    }))
});
} catch (error) {
console.error('Error fetching labs:', error);
res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan saat mengambil data lab'
});
}
});


router.get('/maintenance', (req, res) => res.render('maintenance', { title: 'Maintenance Website' }));
router.post('/maintenance', (req, res) => {
console.log(req.body); // simpan status/jadwal maintenance
res.redirect('/');
});


router.get('/matikan', (req, res) => {
const isOffline = getStatusOffline();
res.render('matikan', { title: 'Matikan Website', isOffline });
});

router.post('/matikan', (req, res) => {
fs.writeFile(statusFile, JSON.stringify({ isOffline: true }), err => {
if (err) {
    console.error('Gagal tulis status.json', err);
    return res.status(500).send('Internal Server Error');
}
console.log('Website dimatikan');
res.redirect('/matikan');
});
});

router.post('/matikan/aktifkan', (req, res) => {
const { adminCode } = req.body;

const correctAdminCode = 'ADMIN2024';

if (!adminCode || adminCode !== correctAdminCode) {
return res.status(403).json({ 
    success: false, 
    message: 'Kode admin salah! Hanya admin yang dapat menghidupkan website kembali' 
});
}

fs.writeFile(statusFile, JSON.stringify({ isOffline: false }), err => {
if (err) {
    console.error('Gagal tulis status.json', err);
    return res.status(500).send('Internal Server Error');
}
console.log('Website diaktifkan kembali oleh admin');
res.redirect('/');
});
});

router.get('/lab/:nama', async (req, res) => {
try {
const labName = req.params.nama.toUpperCase();

const lab = await prisma.lab.findFirst({
    where: { 
    nama_lab: labName 
    }
});

if (!lab) {
    return res.status(404).render('error', {
    title: 'Lab Tidak Ditemukan',
    message: `Lab ${labName} tidak ditemukan dalam database.`,
    error: 'Lab tidak ditemukan'
    });
}

const assistants = await prisma.asistenLab.findMany({
    where: { lab_id: lab.id },
    include: {
    user: {
        select: {
        username: true
        }
    }
    }
});

const praktikum = await prisma.praktikum.findMany({
    where: { lab_id: lab.id }
});

const students = await prisma.mahasiswa.findMany({
    where: {
    praktikum_id: {
        in: praktikum.map(p => p.id)
    }
    },
    include: {
    user: {
        select: {
        username: true
        }
    }
    }
});

const schedules = await prisma.jadwal.findMany({
    where: {
    praktikum_id: {
        in: praktikum.map(p => p.id)
    }
    },
    orderBy: {
    tanggal: 'asc'
    }
});

const modules = await prisma.modul.findMany({
    where: {
    praktikum_id: {
        in: praktikum.map(p => p.id)
    }
    }
});

const labDetail = {
    id: lab.id,
    nama: lab.nama_lab,
    deskripsi: lab.deskripsi || 'Deskripsi lab belum tersedia',
    jadwal: lab.jadwal || 'Jadwal belum ditentukan',
    dosen: lab.dosen || 'Dosen belum ditentukan',
    kapasitas: lab.kapasitas,
    status: lab.status,
    jumlahAsisten: assistants.length,
    jumlahModul: modules.length,
    jumlahKelas: praktikum.length,
    jumlahMahasiswa: students.length,
    asisten: assistants.map(a => a.user.username),
    mahasiswa: students.map(s => s.user.username),
    jadwalKelas: schedules.map(s => {
    const date = new Date(s.tanggal);
    const time = new Date(s.jam);
    return `${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} ${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${s.ruangan || 'Ruangan TBD'} - ${s.materi || 'Materi TBD'}`
    }),
    praktikum: praktikum.map(p => ({
    id: p.id,
    nama: p.nama_praktikum,
    kode: p.kode_masuk
    }))
};

res.render('lab_detail', {
    title: `Detail ${labDetail.nama}`,
    lab: labDetail
});

} catch (error) {
console.error('Error fetching lab details:', error);
res.status(500).render('error', {
    title: 'Error',
    message: 'Terjadi kesalahan saat mengambil detail lab.',
    error: error.message
});
}
});

router.get('/api/statistics/:labId', async (req, res) => {
try {
const { labId } = req.params;

const lab = await prisma.lab.findUnique({
    where: { id: parseInt(labId) }
});

if (!lab) {
    return res.status(404).json({
    success: false,
    message: 'Lab tidak ditemukan'
    });
}

const praktikum = await prisma.praktikum.findMany({
    where: { lab_id: parseInt(labId) }
});

if (praktikum.length === 0) {
    return res.json({
    success: true,
    lab: lab,
    statistics: {
        totalSubmissions: 0,
        completedSubmissions: 0,
        pendingSubmissions: 0,
        averageScore: 0,
        submissionRate: 0,
        monthlyData: [],
        recentSubmissions: []
    }
    });
}

const praktikumIds = praktikum.map(p => p.id);

const tasks = await prisma.tugas.findMany({
    where: { praktikum_id: { in: praktikumIds } }
});

const taskIds = tasks.map(t => t.id);

const submissions = await prisma.pengumpulan.findMany({
    where: { tugas_id: { in: taskIds } },
    include: {
    tugas: {
        include: {
        praktikum: true
        }
    },
    user: {
        select: {
        username: true
        }
    }
    },
    orderBy: {
    waktu_kirim: 'desc'
    }
});

const totalSubmissions = submissions.length;
const completedSubmissions = submissions.filter(s => s.nilai !== null).length;
const pendingSubmissions = totalSubmissions - completedSubmissions;
const averageScore = completedSubmissions > 0 
    ? submissions.filter(s => s.nilai !== null).reduce((sum, s) => sum + s.nilai, 0) / completedSubmissions 
    : 0;

const submissionRate = taskIds.length > 0 ? (totalSubmissions / taskIds.length) * 100 : 0;

const monthlyData = [];
const now = new Date();
for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthSubmissions = submissions.filter(s => {
    const submissionDate = new Date(s.waktu_kirim);
    return submissionDate >= month && submissionDate <= monthEnd;
    });
    
    monthlyData.push({
    month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    submissions: monthSubmissions.length,
    completed: monthSubmissions.filter(s => s.nilai !== null).length,
    averageScore: monthSubmissions.filter(s => s.nilai !== null).length > 0
        ? monthSubmissions.filter(s => s.nilai !== null).reduce((sum, s) => sum + s.nilai, 0) / monthSubmissions.filter(s => s.nilai !== null).length
        : 0
    });
}

const recentSubmissions = submissions.slice(0, 10).map(s => ({
    id: s.id,
    taskTitle: s.tugas.judul,
    studentName: s.user.username,
    submittedAt: s.waktu_kirim,
    score: s.nilai,
    status: s.nilai !== null ? 'Completed' : 'Pending'
}));

res.json({
    success: true,
    lab: lab,
    statistics: {
    totalSubmissions,
    completedSubmissions,
    pendingSubmissions,
    averageScore: Math.round(averageScore * 100) / 100,
    submissionRate: Math.round(submissionRate * 100) / 100,
    monthlyData,
    recentSubmissions
    }
});

} catch (error) {
console.error('Error generating statistics:', error);
res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan saat menghasilkan statistik'
});
}
});

router.get('/api/statistics', async (req, res) => {
try {
const labs = await prisma.lab.findMany({
    orderBy: { id: 'asc' }
});

const allStats = [];

for (const lab of labs) {
    const praktikum = await prisma.praktikum.findMany({
    where: { lab_id: lab.id }
    });
    
    const praktikumIds = praktikum.map(p => p.id);
    const tasks = await prisma.tugas.findMany({
    where: { praktikum_id: { in: praktikumIds } }
    });
    
    const taskIds = tasks.map(t => t.id);
    const submissions = await prisma.pengumpulan.findMany({
    where: { tugas_id: { in: taskIds } }
    });
    
    const totalSubmissions = submissions.length;
    const completedSubmissions = submissions.filter(s => s.nilai !== null).length;
    const averageScore = completedSubmissions > 0 
    ? submissions.filter(s => s.nilai !== null).reduce((sum, s) => sum + s.nilai, 0) / completedSubmissions 
    : 0;
    
    allStats.push({
    labId: lab.id,
    labName: lab.nama_lab,
    totalSubmissions,
    completedSubmissions,
    pendingSubmissions: totalSubmissions - completedSubmissions,
    averageScore: Math.round(averageScore * 100) / 100,
    submissionRate: taskIds.length > 0 ? Math.round((totalSubmissions / taskIds.length) * 10000) / 100 : 0
    });
}

res.json({
    success: true,
    statistics: allStats
});

} catch (error) {
console.error('Error generating all statistics:', error);
res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan saat menghasilkan statistik'
});
}
});

router.get('/statistics', (req, res) => {
res.render('statistics', { title: 'Submission Statistics' });
});

module.exports = router;
