const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const crypto = require('crypto');

const fallbackUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString: fallbackUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function base64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function cleanPrivateKey(key) {
  if (!key) return "";
  let k = key.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  k = k.replaceAll("\\n", "\n");
  k = k.replaceAll("\r\n", "\n");
  return k;
}

async function getAccessToken(clientEmail, privateKey) {
  const formattedKey = cleanPrivateKey(privateKey);
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const signatureInput = `${header}.${claimSet}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  const signature = signer.sign(formattedKey, "base64url");

  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to authenticate.");
  }
  return data.access_token;
}

async function run() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  const token = await getAccessToken(settings.googleDriveClientEmail, settings.googleDrivePrivateKey);

  // Search for any file with Brandon in name
  const query = `name contains 'Brandon' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,createdTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('PDFs/Files found with Brandon:');
  console.log(JSON.stringify(data.files, null, 2));
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
