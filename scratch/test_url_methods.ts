async function testUrl() {
  const url = "https://script.google.com/macros/s/AKfycbzNoYKPgMtew_V9U0DqHLJVHWWLzdGOLih4xeTog11RRGKUmmITsaFAiA3uRVVkNtBdeA/exec";
  
  console.log("Testing GET...");
  const resGet = await fetch(url, { redirect: "follow" });
  console.log("GET status:", resGet.status);
  console.log("GET url:", resGet.url);
  const textGet = await resGet.text();
  console.log("GET snippet:", textGet.slice(0, 400));

  console.log("\nTesting POST...");
  const resPost = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ping: "test" }),
    redirect: "follow",
  });
  console.log("POST status:", resPost.status);
  console.log("POST url:", resPost.url);
  const textPost = await resPost.text();
  console.log("POST snippet:", textPost.slice(0, 400));
}

testUrl().catch(console.error);
