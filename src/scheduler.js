// scheduler.js
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const autoCloseAssignments = async () => {
    const now = new Date();
    await prisma.tugas.updateMany({
        where: {
            tutup_penugasan: true,
            status: 'open',
            batas_waktu: { lt: now }
        },
        data: { status: 'close' }
    });
};

// Jadwalkan tiap 5 menit
cron.schedule('*/1 * * * *', autoCloseAssignments);