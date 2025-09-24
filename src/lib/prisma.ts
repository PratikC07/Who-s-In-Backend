import { PrismaClient } from "../generated/prisma/client.js";

// 1. Extend the global object to include our prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Check if a prisma instance already exists on the global object
const prisma =
  globalForPrisma.prisma ?? // If it exists, reuse it
  new PrismaClient({
    // If not, create a new one
    log: ["query"],
  });

// 3. In non-production environments, save the instance to the global object
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
