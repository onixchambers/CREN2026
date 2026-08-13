import { prisma } from "../src/lib/prisma";

async function main() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  console.log("SystemSettings in DB:");
  console.log("googleDriveEnabled:", settings?.googleDriveEnabled);
  console.log("googleDriveWebhookUrl:", settings?.googleDriveWebhookUrl);
  console.log("googleDriveFolderId:", settings?.googleDriveFolderId);
  console.log("googleDriveClientId:", settings?.googleDriveClientId ? "SET" : "EMPTY");
  console.log("googleDriveClientSecret:", settings?.googleDriveClientSecret ? "SET" : "EMPTY");
  console.log("googleDriveRefreshToken:", settings?.googleDriveRefreshToken ? "SET" : "EMPTY");
  console.log("googleDriveClientEmail:", settings?.googleDriveClientEmail);
}

main().catch(console.error).finally(() => prisma.$disconnect());
