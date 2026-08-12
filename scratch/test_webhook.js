async function testWebhook() {
  const webhookUrl = "https://script.google.com/macros/s/AKfycbwv2xsBukrJ18xqKtYH0XoxQuC3H0K44BiIBqI5ha8HyLHVH2JATg0RUHXjYVYpNTYF/exec";
  const dummyBuffer = Buffer.from("Test Excel File Content");

  try {
    const payload = JSON.stringify({
      fileName: "Informes PDF CREN.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: dummyBuffer.toString("base64"),
      terapeutaName: "Informes PDF CREN"
    });

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
      redirect: "follow"
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response text:", text);
  } catch (err) {
    console.error("Webhook error:", err);
  }
}

testWebhook();
