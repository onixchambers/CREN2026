// Script para migrar horaRegistro existentes a la hora agendada de la cita
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateHoraRegistro() {
  console.log("Buscando sesiones con asistencia guardada...");
  
  const sessions = await prisma.session.findMany({
    include: { patient: true }
  });

  let updated = 0;
  let skipped = 0;

  for (const s of sessions) {
    if (!s.notes) { skipped++; continue; }
    
    try {
      const notes = JSON.parse(s.notes);
      
      // Solo procesar sesiones que tengan asistencia guardada
      if (!notes.asistenciaGuardada) { skipped++; continue; }
      
      // Si tiene hora agendada y es diferente a horaRegistro, actualizar
      if (notes.hora && notes.horaRegistro !== notes.hora) {
        const oldHora = notes.horaRegistro || "-";
        notes.horaRegistro = notes.hora;
        
        await prisma.session.update({
          where: { id: s.id },
          data: { notes: JSON.stringify(notes) }
        });
        
        console.log(`OK ${s.patient?.name || 'Desconocido'} | Fecha: ${notes.fecha || '-'} | ${oldHora} -> ${notes.hora}`);
        updated++;
      } else if (!notes.hora) {
        console.log(`WARN ${s.patient?.name || 'Desconocido'} | Fecha: ${notes.fecha || '-'} | Sin hora agendada, se mantiene: ${notes.horaRegistro || '-'}`);
        skipped++;
      } else {
        skipped++;
      }
    } catch (e) {
      skipped++;
    }
  }

  console.log(`\n--- Resumen ---`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Sin cambios: ${skipped}`);
  console.log("Migracion completada.");
}

migrateHoraRegistro()
  .catch(e => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
