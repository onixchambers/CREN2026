import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Fix accidental quotes in Vercel env vars
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('"') && process.env.DATABASE_URL.endsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.slice(1, -1);
}

// Fallback to the known Supabase URL if Vercel doesn't have it configured
const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

let prismaInstance: PrismaClient;

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
      db: {
        url: fallbackUrl
      }
    }
  });
} catch (error: any) {
  console.error("PRISMA INITIALIZATION ERROR:", error);
  // Create a dummy proxy that throws the initialization error when used
  const dummyHandler = {
    get(target: any, prop: string) {
      throw new Error("PRISMA_INIT_ERROR: " + (error?.message || String(error)));
    }
  };
  prismaInstance = new Proxy({}, dummyHandler) as PrismaClient;
}

export const prisma = prismaInstance;
