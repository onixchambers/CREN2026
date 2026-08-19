const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total Audit Logs:', logs.length);
  for (const l of logs) {
    console.log('Log:', l.createdAt, '| Action:', l.action, '| Details:', l.details, '| Target:', l.target);
  }
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
