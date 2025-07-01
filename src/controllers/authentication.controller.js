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

        // Always use bcrypt to compare passwords for all roles
        const isPasswordValid = await bcrypt.compare(kata_sandi, user.kata_sandi);

        if (!isPasswordValid) {
            return res.status(401).send('ID atau password salah');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            peran: user.peran
        };

        // Redirect based on role
        if (user.peran === 'admin') {
            return res.redirect('/admin');
        }
        if (user.peran === 'asisten') {
            return res.redirect('/lab');
        }
        if (user.peran === 'mahasiswa') {
            return res.redirect('/dashboard-kelas');
        }

        return res.status(403).send('Peran tidak dikenali');
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send('Terjadi kesalahan server: ' + error.message);
    }
};

module.exports = { login };
