const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
.then(() => console.log("✅ Terhubung ke database!"))
.catch(err => console.error("❌ Gagal koneksi:", err));
