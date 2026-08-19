const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const patient = await prisma.patient.findFirst({
    where: { name: { contains: 'Medina' } },
    include: { sessions: true }
  });
  if (!patient) {
    console.log('Patient not found');
    return;
  }
  console.log('Patient:', patient.name, 'ID:', patient.id);
  
  // Sort sessions by date
  const sorted = patient.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  console.log('All sessions found:');
  for (const s of sorted) {
    const dStr = s.date.toISOString().split("T")[0];
    let hStr = s.date.toISOString().split("T")[1]?.substring(0, 5) || "09:00";
    if (s.notes) {
      try {
        const p = JSON.parse(s.notes);
        if (p.fecha) dStr = p.fecha;
        if (p.hora) hStr = p.hora;
      } catch (e) {}
    }
    console.log(`Date: ${dStr} | Time: ${hStr} | Status: ${s.status} | Notes: ${s.notes ? s.notes.substring(0, 100) : 'none'}`);
  }
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
