import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

async function testNewUrl() {
  const newUrl = "https://script.google.com/macros/s/AKfycbzNoYKPgMtew_V9U0DqHLJVHWWLzdGOLih4xeTog11RRGKUmmITsaFAiA3uRVVkNtBdeA/exec";

  console.log("Updating DB with new Webhook URL...");
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: { googleDriveWebhookUrl: newUrl },
    create: { id: 1, googleDriveWebhookUrl: newUrl },
  });

  const ws = XLSX.utils.aoa_to_sheet([["TEST", "EXCEL"], ["1", "2"]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  console.log("Testing POST to new Google Apps Script Webhook URL...");
  const res = await fetch(newUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      fileName: "Informes PDF CREN.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: buffer.toString("base64"),
      terapeutaName: "Informes PDF CREN",
    }),
    redirect: "follow",
  });

  const text = await res.text();
  console.log("Response status:", res.status);
  console.log("Response text:", text);
}

testNewUrl().catch(console.error).finally(() => prisma.$disconnect());
