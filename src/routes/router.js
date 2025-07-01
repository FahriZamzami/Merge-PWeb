// src/routes/router.js
const express = require('express');
const router = express.Router();
const path = require('path');

// ===== Import Middleware =====
const { isAuthenticated } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const setCurrentPath = require('../middlewares/currentPage');

// ===== Import Semua Controller =====
const authenticationController = require('../controllers/authentication.controller');
const registerController = require('../controllers/register.controller');
const homeController = require('../controllers/home.controller');
const assignmentMahasiswaController = require('../controllers/assignmentMahasiswa.controller');
const assignmentController = require('../controllers/assignment.controller');
const labController = require('../controllers/lab.controller');
const tambahKelasController = require('../controllers/tambahKelas.controller');
const jadwalMahasiswaController = require('../controllers/jadwalMahasiswa.controller');
const nilaiMahasiswaController = require('../controllers/nilaiMahasiswa.controller');
const modulController = require('../controllers/modul.controller');
const modulMateriController = require('../controllers/modulMateri.controller');
const pengumumanController = require('../controllers/pengumuman.controller');
const absensiMahasiswaController = require('../controllers/absensiMahasiswa.controller');
const kuisController = require('../controllers/kuis.controller');
const jadwalController = require('../controllers/jadwal.controller');
const mahasiswaController = require('../controllers/mahasiswa.controller');
const absensiController = require('../controllers/absensi.controller');
const praktikumController = require('../controllers/praktikum.controller');
const kelasController = require('../controllers/kelas.controller');

const pengumumanMahasiswaController = require('../controllers/pengumumanMahasiswa.controller');

// ===== Rute yang tidak memerlukan otentikasi =====

// Redirect root ke login
router.get('/', (req, res) => res.redirect('/login'));

// --- Auth ---
router.get('/login', (req, res) => res.render('login'));
router.post('/login', authenticationController.login);

// --- Register ---
router.get('/register', registerController.showRegisterPage);
router.post('/register', registerController.handleFirstStep);
router.post('/register/create', registerController.handleRegisterCreate);

// --- Logout ---
router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});


// ===== Middleware Otentikasi & Inisialisasi Path =====
// Semua rute di bawah ini akan dilindungi dan memiliki `currentPath`
router.use(isAuthenticated);
router.use(setCurrentPath);


// ===== Rute yang Dilindungi (Protected Routes) =====

// === Halaman Utama Mahasiswa ===
router.get('/home', homeController.getClassHomePage);

// === Tugas (Perspektif Mahasiswa) ===
router.get('/tugas', assignmentMahasiswaController.getAllAssignments);
router.get('/assignments/:id/detail', assignmentMahasiswaController.getAssignmentDetail);
router.post('/assignments/:id/submit', upload.single('fileTugas'), assignmentMahasiswaController.submitAssignment);
router.delete('/assignments/:id/delete-submission', assignmentMahasiswaController.deleteSubmission);

// === Assignment (Perspektif Dosen/Admin) ===
router.get('/assignments', assignmentController.getAllAssignments);
router.get('/assignments/create', assignmentController.createAssignmentForm);
router.post('/assignments/add', upload.single('fileTugas'), assignmentController.createAssignment);
router.get('/assignments/:id/edit', assignmentController.editAssignmentForm);
router.post('/penugasan/edit/:id', upload.single('fileTugas'), assignmentController.updateAssignment);
router.post('/assignments/delete/:id', assignmentController.deleteAssignment);
router.get('/penugasan/detail/:id', assignmentController.detailAssignment);
router.get('/assignments/:id/pengumpulan', assignmentController.getPengumpulanByTugasId);
router.get('/assignments/:id/files', assignmentController.getFilesByTugasId);
router.get('/assignments/nilai/:id', assignmentController.beriNilaiForm);
router.post('/assignments/nilai/:id', assignmentController.simpanNilai);
router.post('/assignments/:id/toggle-status', assignmentController.toggleStatusAssignments);

// === Lab & Kelas ===
router.get('/lab', labController.labPage);
router.get('/lab/:lab_id/mahasiswa', labController.getDaftarMahasiswaLabPage);
router.get('/kelas/tambah', tambahKelasController.showTambahKelasPage);
router.post('/kelas/create', tambahKelasController.createKelas);
router.get('/kelas/:id/edit', tambahKelasController.showEditKelasPage);
router.post('/kelas/:id/update', tambahKelasController.updateKelas);
router.post('/kelas/:id/delete', tambahKelasController.deleteKelas);
router.get('/kelas/:id', labController.showHomeClassPage);

// === Jadwal & Nilai (Perspektif Mahasiswa) ===
router.get('/jadwal-kelas', jadwalMahasiswaController.getJadwalMahasiswaPage);
router.get('/rekap-nilai-mahasiswa', nilaiMahasiswaController.getRekapNilai);
router.get('/rekap-nilai-mahasiswa/pdf', nilaiMahasiswaController.exportRekapPDF);
router.get('/rekap-absensi-mahasiswa', absensiMahasiswaController.getRekapAbsensiMahasiswa);
router.get('/rekap-absensi-mahasiswa/pdf', absensiMahasiswaController.exportAbsensiMahasiswaPDF);

// === Modul ===
router.get('/praktikum/:praktikum_id/modul', modulController.getModulPage);
router.post('/praktikum/:praktikum_id/modul/upload', upload.single('fileModul'), modulController.uploadModul);
router.post('/modul/delete/:modul_id', modulController.deleteModul);
router.get('/modul-materi', modulMateriController.modulController.getModulPageMahasiswa);
router.get('/praktikum/:praktikum_id/modul-materi/:modul_id/download', modulMateriController.modulController.downloadModul);

// === Pengumuman ===
router.get('/praktikum/:praktikum_id/pengumuman', pengumumanController.getPengumumanPage);
router.post('/praktikum/:praktikum_id/pengumuman/create', pengumumanController.createPengumuman);
router.post('/pengumuman/delete/:id', pengumumanController.deletePengumuman);

// === Kuis ===
router.get('/praktikum/:praktikum_id/kuis', kuisController.getKuisPage);
router.get('/praktikum/:praktikum_id/kuis/baru', kuisController.showTambahKuisPage);
router.post('/kuis/create', kuisController.createKuis);
router.get('/kuis/:id/soal/tambah', kuisController.showTambahSoalPage);
router.post('/kuis/:id/soal/tambah', kuisController.createSoal);
router.post('/kuis/:id/delete', kuisController.deleteKuis);
router.post('/kuis/:id/toggle-status', kuisController.toggleKuisStatus);
router.get('/kuis/:id/edit', kuisController.showEditKuisPage);
router.post('/kuis/:id/edit', kuisController.updateKuis);
router.get('/kuis/:id/daftar-soal', kuisController.showDaftarSoalPage);
router.get('/kuis/:id/nilai', kuisController.showNilaiKuisPage);
router.get('/kuis/:id/nilai/excel', kuisController.exportNilaiExcel);
router.get('/kuis/:id/nilai/pdf', kuisController.exportNilaiPDF);

// === Jadwal (Perspektif Dosen/Admin) ===
router.get('/lab/:lab_id/jadwal', jadwalController.getJadwalLabPage);
router.get('/praktikum/:praktikum_id/jadwal', jadwalController.getJadwalPage);
router.post('/jadwal/create', jadwalController.createJadwal);
router.post('/jadwal/update/:id', jadwalController.updateJadwal);
router.post('/jadwal/delete/:id', jadwalController.deleteJadwal);
router.post('/jadwal/toggle-status/:id', jadwalController.toggleJadwalStatus);
router.get('/api/jadwal/:id', jadwalController.getJadwalById); // Catatan: ini mungkin lebih cocok di apiRouter

// === Mahasiswa & Absensi (Perspektif Dosen/Admin) ===
router.get('/praktikum/:praktikum_id/mahasiswa', mahasiswaController.getDaftarMahasiswaPage);
router.get('/praktikum/:praktikum_id/mahasiswa/excel', mahasiswaController.exportDaftarMahasiswaExcel);
router.get('/praktikum/:praktikum_id/mahasiswa/pdf', mahasiswaController.exportDaftarMahasiswaPDF);
router.get('/praktikum/:praktikum_id/absensi', absensiController.getAbsensiPage);
router.post('/absensi/save', absensiController.saveAbsensi);
router.get('/praktikum/:praktikum_id/absensi/detail', absensiController.getDetailKehadiranPage);

// === Rekap Nilai & Kehadiran (Perspektif Dosen/Admin) ===
router.get('/praktikum/:id/rekap-nilai', praktikumController.tampilkanRekapNilai);
router.get('/praktikum/:id/rekap-nilai/pdf', praktikumController.exportRekapPDF);
router.get('/praktikum/:id/rekap-nilai/excel', praktikumController.exportRekapExcel);
router.get('/praktikum/:id/kehadiran/excel', praktikumController.exportKehadiranExcel);
router.get('/praktikum/:id/kehadiran/pdf', praktikumController.exportKehadiranPDF);

// === Dashboard Kelas ===
router.get('/dashboard-kelas', kelasController.getDashboard);
router.post('/dashboard-kelas/masuk', kelasController.masukDenganKode);
router.post('/dashboard-kelas/masuk-terdaftar/:praktikumId', kelasController.masukKelasTerdaftar);

router.get('/pengumuman-mahasiswa', pengumumanMahasiswaController.getPengumumanMahasiswa);

module.exports = router;