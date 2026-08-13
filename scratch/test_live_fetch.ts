async function testLiveFetch() {
  const url = "https://script.google.com/macros/s/AKfycbzNoYKPgMtew_V9U0DqHLJVHWWLzdGOLih4xeTog11RRGKUmmITsaFAiA3uRVVkNtBdeA/exec";
  console.log("Fetching live Webhook URL:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ping: "test" }),
    redirect: "follow",
  });

  console.log("Status:", res.status);
  console.log("Final URL:", res.url);
  const text = await res.text();
  console.log("Response text (first 500 chars):");
  console.log(text.slice(0, 500));
}

testLiveFetch().catch(console.error);
