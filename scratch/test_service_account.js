import { prisma } from "../src/lib/prisma.js";
import { uploadFileToGoogleDrive } from "../src/lib/googleDrive.js";

async function testUpload() {
  const dummyBuffer = Buffer.from("Test Excel File");
  
  // Disable webhookUrl temporarily for test so it uses Service Account directly with parent folder
  await prisma.systemSettings.update({
    where: { id: 1 },
    data: { googleDriveWebhookUrl: "" }
  });

  const res = await uploadFileToGoogleDrive(
    dummyBuffer,
    "Informes PDF CREN.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  console.log("Service Account Upload Result:", res);
}

testUpload().finally(() => prisma.$disconnect());
