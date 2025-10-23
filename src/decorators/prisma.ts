import { PrismaClient } from "@prisma/client";
import type Elysia from "elysia";

// Lazy initialization of Prisma client
let prisma: PrismaClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return prisma;
};

const connectPrisma = async (): Promise<void> => {
  if (isConnecting) {
    return connectionPromise!;
  }

  if (prisma) {
    // $isConnected method doesn't exist in newer Prisma versions
    // Just try to connect and handle errors gracefully
    try {
      await prisma.$connect();
      return;
    } catch {
      // Connection failed, continue with reconnection logic
    }
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const client = getPrismaClient();
      await client.$connect();
      console.log("✅ Prisma connected to database");
    } catch (error) {
      console.error("❌ Error connecting to Prisma:", error);
      throw error;
    } finally {
      isConnecting = false;
    }
  })();

  return connectionPromise;
};

const prismaElysia = (app: Elysia) =>
  app.decorate("prisma", getPrismaClient()).derive(async () => {
    // Connect on first request
    await connectPrisma();
    return {};
  });

// Graceful shutdown
process.on("beforeExit", async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

export default prismaElysia;
export { connectPrisma, getPrismaClient };
