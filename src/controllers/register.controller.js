const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const showRegisterPage = (req, res) => {
    req.session.registerStep = 1;
    res.render('register', { step: 1, error: null, nama: '', nim: '' });
};

const handleFirstStep = async (req, res) => {
    const { nama, nim } = req.body;

    if (!req.session) return res.redirect('/login');

    if (!nama || !nim) {
        return res.render('register', { step: 1, error: 'Nama dan NIM tidak boleh kosong.', nama, nim });
    }

    if (nim.length !== 10 || nim.substring(2, 6) !== '1152') {
        return res.render('register', { step: 1, error: 'Format NIM tidak valid.', nama, nim });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: nim } });
    if (existingUser) {
        return res.render('register', { step: 1, error: 'NIM sudah terdaftar.', nama, nim });
    }

    req.session.registerStep = 2;
    req.session.nama = nama;
    req.session.nim = nim;

    res.render('register', { step: 2, nama, nim, error: null });
};

const handleRegisterCreate = async (req, res) => {
    console.log('📥 req.body:', req.body);
    console.log('📥 session:', req.session);

    const nama = req.session.nama;
    const nim = req.session.nim;
    const { password, verifikasi_password } = req.body;

    if (!req.session || req.session.registerStep !== 2 || !nama || !nim) {
        return res.redirect('/register');
    }

    console.log('📥 Registering user:', { nama, nim });

    if (!password || !verifikasi_password) {
        return res.render('register', { step: 2, error: 'Password tidak boleh kosong.', nama, nim });
    }

    if (password.length < 8) {
        return res.render('register', { step: 2, error: 'Password minimal 8 karakter.', nama, nim });
    }

    if (password !== verifikasi_password) {
        return res.render('register', { step: 2, error: 'Konfirmasi password tidak cocok.', nama, nim });
    }

    const username = nama;

    try {
        await prisma.user.create({
            data: {
                id: nim,
                username: username,
                kata_sandi: password,
                peran: 'mahasiswa',
                dibuat_pada: new Date()
            },
        });

        req.session.registerStep = null;
        req.session.nama = null;
        req.session.nim = null;

        res.redirect('/login');
    } catch (error) {
        console.error('❌ Register error:', error);
        return res.render('register', {
            step: 2,
            error: 'Terjadi kesalahan saat menyimpan data. ' + error.message,
            nama,
            nim
        });
    }
};

module.exports = {
    showRegisterPage,
    handleFirstStep,
    handleRegisterCreate,
};
