const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateRandomId(length = 6) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitted O, 0, I, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function main() {
  console.log('Fetching patients without displayId...');
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { displayId: null },
        { displayId: '' }
      ]
    }
  });

  console.log(`Found ${patients.length} patients to update.`);

  let updatedCount = 0;
  for (const patient of patients) {
    let newId;
    let isUnique = false;
    
    // Ensure the generated ID is unique
    while (!isUnique) {
      newId = generateRandomId(6);
      const existing = await prisma.patient.findUnique({
        where: { displayId: newId }
      });
      if (!existing) {
        isUnique = true;
      }
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: { displayId: newId }
    });
    
    updatedCount++;
    if (updatedCount % 10 === 0) {
      console.log(`Updated ${updatedCount} / ${patients.length}...`);
    }
  }

  console.log(`Finished updating ${updatedCount} patients.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
