const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const bcrypt = require('bcrypt');

const libsql = createClient({ url: 'file:./dev.db' });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@cren.com' },
    update: {},
    create: {
      email: 'admin@cren.com',
      name: 'Administrador',
      password,
      role: 'ADMIN',
    },
  });
  console.log('Usuario creado exitosamente:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
