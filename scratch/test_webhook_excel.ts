import * as XLSX from "xlsx";

async function testWebhook() {
  const webhookUrl = "https://script.google.com/macros/s/AKfycbwv2xsBukrJ18xqKtYH0XoxQuC3H0K44BiIBqI5ha8HyLHVH2JATg0RUHXjYVYpNTYF/exec";

  const ws = XLSX.utils.aoa_to_sheet([["TEST", "EXCEL"], ["1", "2"]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  console.log("Sending Excel to Google Apps Script Webhook...");
  const res = await fetch(webhookUrl, {
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

testWebhook().catch(console.error);
