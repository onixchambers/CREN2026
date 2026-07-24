const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected to DB!');
    
    // Check if column exists
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='User' and column_name='especialidad';");
    
    if (res.rows.length === 0) {
      console.log('Adding especialidad column...');
      await client.query('ALTER TABLE "User" ADD COLUMN "especialidad" TEXT;');
      console.log('Column added successfully.');
    } else {
      console.log('Column already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();