const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
});

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Pooler connection SUCCESS", users.length);
  } catch(e) {
    console.error("Pooler connection ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
