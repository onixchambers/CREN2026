async function testOldUrl() {
  const oldUrl = "https://script.google.com/macros/s/AKfycbwv2xsBukrJ18xqKtYH0XoxQuC3H0K44BiIBqI5ha8HyLHVH2JATg0RUHXjYVYpNTYF/exec";
  console.log("Fetching old Webhook URL:", oldUrl);

  const res = await fetch(oldUrl, {
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

testOldUrl().catch(console.error);
