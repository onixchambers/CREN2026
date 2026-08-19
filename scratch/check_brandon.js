const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  // Find patient Brandon Isai Medina Gonzalez
  const patient = await prisma.patient.findFirst({
    where: { name: { contains: 'Medina' } },
    include: { sessions: true }
  });
  if (patient) {
    console.log('Patient:', patient.name, 'ID:', patient.id);
    for (const s of patient.sessions) {
      console.log('Session Date:', s.date, 'Status:', s.status, 'Notes:', s.notes);
    }
  } else {
    console.log('No patient found with name containing Medina');
  }
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
