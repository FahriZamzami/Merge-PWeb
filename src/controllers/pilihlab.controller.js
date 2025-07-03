// // src/controllers/pilihlab.controller.js

// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// // Fungsi ini tidak perlu diubah
// const getPilihPraktikumPage = async (req, res) => {
//     try {
//         const user = req.session.user;
//         if (!user) {
//             return res.redirect('/login');
//         }
//         const labsWithPraktikums = await prisma.lab.findMany({
//             include: {
//                 praktikum: { orderBy: { nama_praktikum: 'asc' } }
//             },
//             orderBy: { nama_lab: 'asc' }
//         });
//         const enrolledPraktikums = await prisma.mahasiswa.findMany({
//             where: { user_id: user.id },
//             select: { praktikum_id: true }
//         });
//         const enrolledIds = new Set(enrolledPraktikums.map(p => p.praktikum_id));
//         const error = req.query.error || null;
//         res.render('pilihLab', {
//             title: 'Pilih Praktikum',
//             labsWithPraktikums,
//             enrolledIds,
//             error,
//             user
//         });
//     } catch (error) {
//         console.error("Error fetching lab & praktikum list:", error);
//         res.status(500).send('Terjadi kesalahan pada server');
//     }
// };

// // Fungsi untuk memproses gabung kelas
// const joinPraktikum = async (req, res) => {
//     try {
//         const { praktikumId, kodeMasuk } = req.body;
//         const userId = req.session.user.id;
//         const praktikumIdInt = parseInt(praktikumId);

//         const praktikum = await prisma.praktikum.findUnique({
//             where: { id: praktikumIdInt }
//         });

//         if (!praktikum) {
//             req.session.flash_error = 'Praktikum tidak ditemukan.';
//             return res.redirect('/pilihLab');
//         }

//         if (praktikum.kode_masuk !== kodeMasuk) {
//             req.session.flash_error = `Kode masuk salah untuk ${praktikum.nama_praktikum}.`;
//             return res.redirect('/pilihLab');
//         }

//         const isEnrolled = await prisma.mahasiswa.findUnique({
//             where: {
//                 user_id_praktikum_id: {
//                     user_id: userId,
//                     praktikum_id: praktikumIdInt
//                 }
//             }
//         });

//         if (isEnrolled) {
//             req.session.flash_error = 'Anda sudah terdaftar di praktikum ini.';
//             return res.redirect('/pilihLab');
//         }

//         await prisma.mahasiswa.create({
//             data: {
//                 user_id: userId,
//                 praktikum_id: praktikumIdInt,
//                 waktu_daftar: new Date()
//             }
//         });
        
//         req.session.flash_success = `Selamat, Anda berhasil bergabung dengan ${praktikum.nama_praktikum}!`;
        
//         // ===================================================
//         // #### PERBAIKAN UTAMA ADA DI BARIS INI ####
//         // Mengarahkan ke halaman /home sesuai permintaan Anda
//         // ===================================================
//         res.redirect('/home');

//     } catch (error) {
//         console.error("Error joining praktikum:", error);
//         req.session.flash_error = 'Terjadi kesalahan internal saat mencoba bergabung.';
//         res.redirect('/pilihLab');
//     }
// };

// module.exports = {
//     getPilihPraktikumPage,
//     joinPraktikum
// };