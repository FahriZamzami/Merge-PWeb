const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

const statusFile = path.join(__dirname, '..', '..', 'status.json');

// Helper baca status offline dari file
function getStatusOffline() {
try {
const data = fs.readFileSync(statusFile, 'utf8');
const status = JSON.parse(data);
return status.isOffline;
} catch {
return false;
}
}

// Test database connection
async function testDatabaseConnection() {
try {
await prisma.$connect();
console.log('✅ Database connected successfully');
} catch (error) {
console.error('❌ Database connection failed:', error);
}
}

testDatabaseConnection();

// Halaman Utama (Dashboard)
router.get('/admin', async (req, res) => {
try {
const labs = await prisma.lab.findMany({
    orderBy: { id: 'asc' }
});

const activeUsers = await prisma.user.count();
const totalAnnouncements = await prisma.pengumuman.count();

// In a real app, you might want more complex aggregations
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

// Logout route
router.get('/logout', (req, res) => {
// Clear any session data
res.clearCookie('sessionId');
res.clearCookie('adminSession');

// Redirect to home page
res.redirect('/');
});

// Halaman Informasi
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

// Fitur User
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

router.get('/user/tambah', (req, res) => res.render('user_tambah', { title: 'Tambah User' }));

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

// Database routes for user management
router.post('/user/create', async (req, res) => {
try {
const { nama, username, password, peran } = req.body;

console.log('Received data:', { nama, username, password, peran }); // Debug log

// Validate required fields
if (!nama || !username || !password || !peran) {
    return res.status(400).json({ 
    success: false, 
    message: 'Semua field harus diisi' 
    });
}

// Convert peran to lowercase and validate
const peranLower = peran.toLowerCase();
console.log('Converted peran:', peranLower); // Debug log

if (!['admin', 'mahasiswa', 'asisten'].includes(peranLower)) {
    return res.status(400).json({ 
    success: false, 
    message: 'Peran harus admin, mahasiswa, atau asisten' 
    });
}

// Check if username already exists
const existingUser = await prisma.user.findUnique({
    where: { username }
});

if (existingUser) {
    return res.status(400).json({ 
    success: false, 
    message: 'Username sudah digunakan' 
    });
}

// Create new user
const newUser = await prisma.user.create({
    data: {
    id: username, // Using username as ID
    fullName: nama,
    username: username,
    kata_sandi: password, // In production, hash this password
    peran: peranLower
    }
});

res.json({ 
    success: true, 
    message: 'User berhasil ditambahkan',
    user: {
    id: newUser.id,
    fullName: newUser.fullName,
    username: newUser.username,
    peran: newUser.peran
    }
});
} catch (error) {
console.error('Error creating user:', error);
res.status(500).json({ 
    success: false, 
    message: 'Terjadi kesalahan saat menambah user' 
});
}
});

router.put('/user/update/:id', async (req, res) => {
try {
const { id } = req.params;
const { nama, username, peran } = req.body;

// Validate required fields
if (!nama || !username || !peran) {
    return res.status(400).json({ 
    success: false, 
    message: 'Semua field harus diisi' 
    });
}

// Convert peran to lowercase and validate
const peranLower = peran.toLowerCase();
if (!['admin', 'mahasiswa', 'asisten'].includes(peranLower)) {
    return res.status(400).json({ 
    success: false, 
    message: 'Peran harus admin, mahasiswa, atau asisten' 
    });
}

// Check if username already exists for other users
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

// Update user
const updatedUser = await prisma.user.update({
    where: { id },
    data: {
    fullName: nama,
    username: username,
    peran: peranLower
    }
});

res.json({ 
    success: true, 
    message: 'User berhasil diperbarui',
    user: {
    id: updatedUser.id,
    fullName: updatedUser.fullName,
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

// POST route for user deletion (for form submission)
router.post('/user/hapus', async (req, res) => {
try {
const { userId } = req.body;

if (!userId) {
    return res.status(400).json({ 
    success: false, 
    message: 'ID user diperlukan' 
    });
}

// Check if user exists
const user = await prisma.user.findUnique({
    where: { id: userId }
});

if (!user) {
    return res.status(404).json({ 
    success: false, 
    message: 'User tidak ditemukan' 
    });
}

// Prevent deletion of admin users
if (user.peran === 'admin') {
    return res.status(403).json({ 
    success: false, 
    message: 'Tidak dapat menghapus user admin' 
    });
}

// Delete related data first (cascade delete)
await prisma.$transaction(async (tx) => {
    // Delete related records in order
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
    
    // Finally delete the user
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

// Check if user exists
const user = await prisma.user.findUnique({
    where: { id: userId }
});

if (!user) {
    return res.status(404).json({ 
    success: false, 
    message: 'User tidak ditemukan' 
    });
}

// Prevent deletion of admin users
if (user.peran === 'admin') {
    return res.status(403).json({ 
    success: false, 
    message: 'Tidak dapat menghapus user admin' 
    });
}

// Delete related data first (cascade delete)
await prisma.$transaction(async (tx) => {
    // Delete related records in order
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
    
    // Finally delete the user
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

// Fitur Pengumuman
router.get('/pengumuman', (req, res) => res.render('pengumumanAdmin', { title: 'Buat Pengumuman' }));

router.get('/pengumuman/list', (req, res) => res.render('pengumuman_list', { title: 'Daftar Pengumuman' }));

router.post('/pengumuman', async (req, res) => {
try {
// Ambil data dari body
const { judul, isi } = req.body;
// Validasi
if (!isi) {
    return res.status(400).json({ success: false, message: 'Isi pengumuman harus diisi' });
}
// Gabungkan judul dan isi jika ada judul
const fullContent = judul ? `${judul}: ${isi}` : isi;
// Simpan ke database (praktikum_id: 8, dibuat_oleh: 'adm001')
const announcement = await prisma.pengumuman.create({
    data: {
    isi: fullContent,
    praktikum_id: 8,
    dibuat_oleh: 'adm001'
    }
});
res.json({ success: true, message: 'Pengumuman berhasil dipublikasikan', announcement });
} catch (error) {
console.error('Error creating announcement:', error);
res.status(500).json({ success: false, message: 'Terjadi kesalahan saat membuat pengumuman', error: error.message });
}
});

// Get all announcements
router.get('/api/pengumuman', async (req, res) => {
try {
const announcements = await prisma.pengumuman.findMany({
    include: {
    pembuat: {
        select: {
        fullName: true,
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
    dibuat_oleh: ann.pembuat?.fullName || ann.pembuat?.username || ann.dibuat_oleh,
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

// Delete announcement - harus sebelum route dengan parameter
router.delete('/api/pengumuman/:id', async (req, res) => {
console.log('DELETE /api/pengumuman/' + req.params.id);
try {
const { id } = req.params;

// Check if announcement exists
const announcement = await prisma.pengumuman.findUnique({
    where: { id: parseInt(id) }
});

if (!announcement) {
    return res.status(404).json({ 
    success: false, 
    message: 'Pengumuman tidak ditemukan' 
    });
}

// Delete announcement
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

// Get announcements by lab
router.get('/api/pengumuman/:lab', async (req, res) => {
try {
const { lab } = req.params;

// Karena tidak ada field target_lab di database, kita ambil semua pengumuman
const announcements = await prisma.pengumuman.findMany({
    include: {
    pembuat: {
        select: {
        fullName: true,
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
    dibuat_oleh: ann.pembuat?.fullName || ann.pembuat?.username || ann.dibuat_oleh,
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

// Lab Management API Routes
router.post('/api/lab/create', async (req, res) => {
try {
const { nama, fullName, deskripsi, jadwal, dosen } = req.body;

console.log('Received lab data:', { nama, fullName, deskripsi, jadwal, dosen });

// Validate required fields
if (!nama || !fullName || !deskripsi || !jadwal || !dosen) {
    return res.status(400).json({ 
    success: false, 
    message: 'Semua field harus diisi' 
    });
}

// Validate lab name format (should be uppercase, no spaces)
const labNameRegex = /^[A-Z0-9]+$/;
if (!labNameRegex.test(nama)) {
    return res.status(400).json({ 
    success: false, 
    message: 'Nama lab harus berupa huruf kapital dan angka tanpa spasi (contoh: LEA, LABGIS, LBI)' 
    });
}

// Check if lab name already exists
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

// Create new lab
const newLab = await prisma.lab.create({
    data: {
    nama_lab: nama,
    deskripsi: deskripsi,
    jadwal: jadwal,
    dosen: dosen,
    // Add default values for other required fields
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

// Delete lab
router.delete('/api/lab/:id', async (req, res) => {
try {
const { id } = req.params;

console.log('Deleting lab with ID:', id);

// Check if lab exists
const lab = await prisma.lab.findUnique({
    where: { id: parseInt(id) }
});

if (!lab) {
    return res.status(404).json({ 
    success: false, 
    message: 'Lab tidak ditemukan' 
    });
}

// Check if lab has related data (practicums, etc.)
const relatedData = await prisma.praktikum.findFirst({
    where: { lab_id: parseInt(id) }
});

if (relatedData) {
    return res.status(400).json({ 
    success: false, 
    message: 'Tidak dapat menghapus lab yang memiliki data praktikum terkait' 
    });
}

// Delete lab
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

// Update lab
router.put('/api/lab/:id', async (req, res) => {
try {
const { id } = req.params;
const { nama, fullName, deskripsi, jadwal, dosen, kapasitas, status } = req.body;

console.log('Updating lab with ID:', id, 'Data:', req.body);

// Check if lab exists
const existingLab = await prisma.lab.findUnique({
    where: { id: parseInt(id) }
});

if (!existingLab) {
    return res.status(404).json({ 
    success: false, 
    message: 'Lab tidak ditemukan' 
    });
}

// Validate lab name format if provided
if (nama) {
    const labNameRegex = /^[A-Z0-9]+$/;
    if (!labNameRegex.test(nama)) {
    return res.status(400).json({ 
        success: false, 
        message: 'Nama lab harus berupa huruf kapital dan angka tanpa spasi' 
    });
    }
}

// Check if new name conflicts with other labs
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

// Update lab
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

// Get all labs
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

// Maintenance
router.get('/maintenance', (req, res) => res.render('maintenance', { title: 'Maintenance Website' }));
router.post('/maintenance', (req, res) => {
console.log(req.body); // simpan status/jadwal maintenance
res.redirect('/');
});

// Halaman Matikan Website (form, kirim status ke view)
router.get('/matikan', (req, res) => {
const isOffline = getStatusOffline();
res.render('matikan', { title: 'Matikan Website', isOffline });
});

// POST Matikan Website (set isOffline = true)
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

// POST Hidupkan Website (set isOffline = false) - Admin only
router.post('/matikan/aktifkan', (req, res) => {
const { adminCode } = req.body;

// Admin code validation - you can change this to any code you want
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

// Detail Tiap Lab - Database Driven
router.get('/lab/:nama', async (req, res) => {
try {
const labName = req.params.nama.toUpperCase();

// Get lab details from database
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

// Get assistants for this lab
const assistants = await prisma.asistenLab.findMany({
    where: { lab_id: lab.id },
    include: {
    user: {
        select: {
        fullName: true,
        username: true
        }
    }
    }
});

// Get praktikum for this lab
const praktikum = await prisma.praktikum.findMany({
    where: { lab_id: lab.id }
});

// Get students enrolled in this lab's praktikum
const students = await prisma.mahasiswa.findMany({
    where: {
    praktikum_id: {
        in: praktikum.map(p => p.id)
    }
    },
    include: {
    user: {
        select: {
        fullName: true,
        username: true
        }
    }
    }
});

// Get schedules for this lab's praktikum
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

// Get modules for this lab's praktikum
const modules = await prisma.modul.findMany({
    where: {
    praktikum_id: {
        in: praktikum.map(p => p.id)
    }
    }
});

// Format the data for the view
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
    asisten: assistants.map(a => a.user.fullName || a.user.username),
    mahasiswa: students.map(s => s.user.fullName || s.user.username),
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

// Generate Statistics for Lab Submissions
router.get('/api/statistics/:labId', async (req, res) => {
try {
const { labId } = req.params;

// Get lab details
const lab = await prisma.lab.findUnique({
    where: { id: parseInt(labId) }
});

if (!lab) {
    return res.status(404).json({
    success: false,
    message: 'Lab tidak ditemukan'
    });
}

// Get praktikum for this lab
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

// Get all tasks for this lab's praktikum
const tasks = await prisma.tugas.findMany({
    where: { praktikum_id: { in: praktikumIds } }
});

const taskIds = tasks.map(t => t.id);

// Get all submissions
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
        fullName: true,
        username: true
        }
    }
    },
    orderBy: {
    waktu_kirim: 'desc'
    }
});

// Calculate statistics
const totalSubmissions = submissions.length;
const completedSubmissions = submissions.filter(s => s.nilai !== null).length;
const pendingSubmissions = totalSubmissions - completedSubmissions;
const averageScore = completedSubmissions > 0 
    ? submissions.filter(s => s.nilai !== null).reduce((sum, s) => sum + s.nilai, 0) / completedSubmissions 
    : 0;

// Calculate submission rate (submissions per task)
const submissionRate = taskIds.length > 0 ? (totalSubmissions / taskIds.length) * 100 : 0;

// Get monthly data for the last 6 months
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

// Get recent submissions (last 10)
const recentSubmissions = submissions.slice(0, 10).map(s => ({
    id: s.id,
    taskTitle: s.tugas.judul,
    studentName: s.user.fullName || s.user.username,
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

// Get statistics for all labs
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

// Statistics page
router.get('/statistics', (req, res) => {
res.render('statistics', { title: 'Submission Statistics' });
});

module.exports = router;