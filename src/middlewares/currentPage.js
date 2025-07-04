// src/middlewares/currentPage.js
const setCurrentPath = (req, res, next) => {
    res.locals.currentPath = req.originalUrl;
    next();
};

module.exports = setCurrentPath;