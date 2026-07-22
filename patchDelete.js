const fs = require("fs");
const path = "src/app/actions/pacientes.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /await prisma\.patient\.delete\(\{\s*where: \{ id \}\s*\}\);/,
  `await prisma.$transaction([
      prisma.session.deleteMany({ where: { patientId: id } }),
      prisma.payment.deleteMany({ where: { patientId: id } }),
      prisma.patient.delete({ where: { id } })
    ]);`
);

fs.writeFileSync(path, content);
console.log("Actions patched for cascade delete");
