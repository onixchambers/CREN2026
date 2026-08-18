const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function main() {
  console.log("Querying database using optimized date filter...");
  const pool = new Pool({ connectionString: fallbackUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const sessions = await prisma.session.findMany({
      where: {
        date: {
          lte: tomorrow
        }
      },
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        patientId: true,
        therapistId: true,
        patient: {
          select: {
            id: true,
            name: true,
            displayId: true,
            precioTerapia: true,
            medicoTratante: true,
            sexo: true,
            age: true
          }
        },
        therapist: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: "desc" },
      take: 400
    });
    console.log("Sessions count:", sessions.length);
    if (sessions.length > 0) {
      console.log("First session sample (most recent <= tomorrow):", JSON.stringify(sessions[0], null, 2));
      console.log("Last session sample in the batch:", JSON.stringify(sessions[sessions.length - 1], null, 2));
    }
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
