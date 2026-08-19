const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const patient = await prisma.patient.findFirst({
    where: { name: { contains: 'Camila Regina Nava' } },
    include: { sessions: true }
  });
  if (!patient) {
    console.log('Patient not found');
    return;
  }
  console.log('Patient:', patient.name, 'ID:', patient.id, 'PrecioTerapia:', patient.precioTerapia);
  for (const s of patient.sessions) {
    console.log('Session Date:', s.date, 'Status:', s.status, 'Notes:', s.notes);
  }
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
