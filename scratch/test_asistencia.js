const { getAsistenciasDB } = require("./src/app/actions/asistencia");

async function main() {
  const res = await getAsistenciasDB();
  console.log("getAsistenciasDB result:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
