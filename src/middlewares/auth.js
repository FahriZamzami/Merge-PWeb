// middlewares/auth.js
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // lanjut ke route berikutnya
    }
    // Jika belum login, redirect ke halaman login
    return res.redirect('/login');
}

module.exports = { isAuthenticated };