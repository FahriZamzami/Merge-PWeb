// src/index.js

const express = require('express');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();

// ===== Import Router =====
const mainRouter = require('./routes/router'); 
const adminRouter = require('./routes/adminRouter'); 

// ===== Middleware & Konfigurasi =====
app.use(session({
    secret: 'rahasia_super_aman',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set ke true jika menggunakan HTTPS di produksi
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ===== Route download file aman =====
// Rute ini bisa tetap di sini atau dipindahkan ke dalam router jika diinginkan
app.get('/download/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename);
    } else {
        res.status(404).send('File tidak ditemukan');
    }
});

// Menjalankan scheduler (jika ada)
require('./scheduler');

// ===== MOUNT ROUTERS =====
// Gunakan router utama untuk semua rute aplikasi web
app.use('/', mainRouter); 
app.use('/', adminRouter); 

// ===== START SERVER =====
const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
