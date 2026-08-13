import { prisma } from "../src/lib/prisma";

async function main() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  console.log("Current DB googleDriveWebhookUrl:");
  console.log(settings?.googleDriveWebhookUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
