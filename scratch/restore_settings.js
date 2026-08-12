import { prisma } from "../src/lib/prisma.js";

async function restore() {
  await prisma.systemSettings.update({
    where: { id: 1 },
    data: {
      googleDriveWebhookUrl: "https://script.google.com/macros/s/AKfycbwv2xsBukrJ18xqKtYH0XoxQuC3H0K44BiIBqI5ha8HyLHVH2JATg0RUHXjYVYpNTYF/exec"
    }
  });
  console.log("Restored googleDriveWebhookUrl.");
}

restore().finally(() => prisma.$disconnect());
