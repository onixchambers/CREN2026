const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Buscando '799' en pacientes...");
  const patients = await prisma.patient.findMany();
  let updatedPatients = 0;
  for (const p of patients) {
    let changed = false;
    let newMetodo = p.metodoPago;
    let newPrecio = p.precioTerapia;
    
    if (newMetodo && newMetodo.includes('799')) {
      newMetodo = newMetodo.replace(/799/g, '800');
      changed = true;
    }
    if (newPrecio && newPrecio.includes('799')) {
      newPrecio = newPrecio.replace(/799/g, '800');
      changed = true;
    }
    
    if (changed) {
      await prisma.patient.update({
        where: { id: p.id },
        data: { metodoPago: newMetodo, precioTerapia: newPrecio }
      });
      updatedPatients++;
      console.log(`Paciente ${p.name} actualizado: Metodo=${newMetodo}, Precio=${newPrecio}`);
    }
  }

  console.log("Buscando '799' en sesiones (notas)...");
  const sessions = await prisma.session.findMany();
  let updatedSessions = 0;
  for (const s of sessions) {
    if (s.notes && s.notes.includes('799')) {
      const newNotes = s.notes.replace(/799/g, '800');
      await prisma.session.update({
        where: { id: s.id },
        data: { notes: newNotes }
      });
      updatedSessions++;
      console.log(`Sesión ${s.id} actualizada.`);
    }
  }

  console.log(`Terminado. Pacientes actualizados: ${updatedPatients}. Sesiones actualizadas: ${updatedSessions}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
