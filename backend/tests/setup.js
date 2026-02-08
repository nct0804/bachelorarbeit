const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// This will be called once before all tests run
beforeAll(async () => {
  // Any setup you need
});

// This is the critical part - close the Prisma connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
  // Add a small delay to ensure all connections are properly closed
  await new Promise(resolve => setTimeout(resolve, 500));
});