import { prisma } from "../src/lib/prisma.js";

async function check() {
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    console.log("googleDriveEnabled:", s?.googleDriveEnabled);
    console.log("googleDriveWebhookUrl:", s?.googleDriveWebhookUrl);
    console.log("googleDriveFolderId:", s?.googleDriveFolderId);
    console.log("googleDriveClientEmail:", s?.googleDriveClientEmail);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
