import { PrismaClient } from "@prisma/client";

export function generateRandomDisplayId(length = 6) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted O, 0, I, 1
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function generateUniqueDisplayId(prisma: any) {
  let isUnique = false;
  let newId = "";
  while (!isUnique) {
    newId = generateRandomDisplayId(6);
    const existing = await prisma.patient.findUnique({
      where: { displayId: newId }
    });
    if (!existing) {
      isUnique = true;
    }
  }
  return newId;
}
