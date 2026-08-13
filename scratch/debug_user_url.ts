async function debugUserUrl() {
  const url = "https://script.google.com/macros/s/AKfycbzNoYKPgMtew_V9U0DqHLJVHWWLzdGOLih4xeTog11RRGKUmmITsaFAiA3uRVVkNtBdeA/exec";

  console.log("Sending POST to exact user URL:", url);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      fileName: "Test.txt",
      mimeType: "text/plain",
      base64: Buffer.from("Hello World").toString("base64"),
    }),
    redirect: "follow",
  });

  console.log("Status:", res.status);
  console.log("Response URL:", res.url);
  const text = await res.text();
  console.log("Response text:");
  console.log(text.slice(0, 1000));
}

debugUserUrl().catch(console.error);
