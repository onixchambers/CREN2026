const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  console.log('Drive Enabled:', settings.googleDriveEnabled);
  console.log('Client Email:', settings.googleDriveClientEmail);
  console.log('Folder ID:', settings.googleDriveFolderId);
  console.log('Webhook URL:', settings.googleDriveWebhookUrl);
  // Omit private key for security logs, but check if present
  console.log('Private Key Present:', !!settings.googleDrivePrivateKey);
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
