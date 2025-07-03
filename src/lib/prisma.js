const { PrismaClient } = require('@prisma/client');

// Set default database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mysql://root:password@localhost:3306/labcorner";
  console.log('⚠️ Using default database URL. Please set DATABASE_URL in .env file for production.');
}

const prisma = new PrismaClient();

module.exports = prisma;