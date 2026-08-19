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
      scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
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
    throw new Error(data.error_description || data.error || "Failed to authenticate with Google Drive.");
  }
  return data.access_token;
}

async function run() {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  if (!settings || !settings.googleDriveEnabled) {
    console.log('Google Drive is not enabled.');
    return;
  }

  const token = await getAccessToken(settings.googleDriveClientEmail, settings.googleDrivePrivateKey);
  console.log('Successfully authenticated. Token obtained.');

  // Let's search for files containing 'Informes PDF CREN' or 'Brandon' in their name
  const query = `name contains 'Informes PDF CREN' or name contains 'Brandon'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Search Results:');
  console.log(JSON.stringify(data.files, null, 2));

  // For each spreadsheet found, let's list its sheets and try to print any row containing Brandon
  for (const file of data.files || []) {
    if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      console.log(`\nReading Spreadsheet: ${file.name} (ID: ${file.id})`);
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${file.id}?includeGridData=true`;
      const sheetRes = await fetch(sheetUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sheetRes.ok) {
        const sheetData = await sheetRes.json();
        console.log(`Loaded spreadsheet structure. Sheets:`, sheetData.sheets.map(s => s.properties.title));
        
        for (const sheet of sheetData.sheets) {
          const rows = sheet.data?.[0]?.rowData || [];
          console.log(`Sheet "${sheet.properties.title}" has ${rows.length} rows.`);
          
          for (let rIndex = 0; rIndex < rows.length; rIndex++) {
            const row = rows[rIndex];
            const cells = row.values?.map(v => v.formattedValue || v.userEnteredValue?.stringValue || '') || [];
            const rowText = cells.join(' | ');
            if (rowText.toLowerCase().includes('brandon')) {
              console.log(`Row ${rIndex + 1}: ${rowText}`);
            }
          }
        }
      } else {
        console.log(`Failed to read sheet data: ${sheetRes.statusText}`);
      }
    }
  }
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
