// src/controllers/authentication.controller.js

const bcrypt = require('bcrypt');
const prisma = require('../../prisma/client');

const login = async (req, res) => {
    try {
        const { id, kata_sandi } = req.body;
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(401).send('ID atau password salah');
        }

        const isPasswordValid = user.peran === 'admin'
            ? await bcrypt.compare(kata_sandi, user.kata_sandi)
            : user.kata_sandi === kata_sandi;

        if (!isPasswordValid) {
            return res.status(401).send('ID atau password salah');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            peran: user.peran
        };

        // Arahkan berdasarkan peran
        if (user.peran === 'admin') {
            return res.redirect('/admin/dashboard'); // Ganti dengan URL dashboard admin Anda
        }
        if (user.peran === 'asisten') {
            return res.redirect('/lab');
        }
        if (user.peran === 'mahasiswa') {
            // ===================================================
            // #### PERBAIKAN DI SINI ####
            // Arahkan ke /welcome, BUKAN /home
            // ===================================================
            return res.redirect('/dashboard-kelas'); 
        }

        return res.status(403).send('Peran tidak dikenali');
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send('Terjadi kesalahan server: ' + error.message);
    }
};

module.exports = { login };