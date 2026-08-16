import { prisma } from "../src/lib/prisma";

async function main() {
  const patients = await prisma.patient.findMany({
    include: {
      sessions: {
        include: {
          therapist: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Total de pacientes en BD: ${patients.length}`);

  const byTherapist: Record<string, {
    total: number;
    pacientes: Array<{
      id: string;
      displayId: string | null;
      nombre: string;
      estatus: string;
      nac: string;
      email: string;
      faltaNacimiento: boolean;
      faltaCorreo: boolean;
    }>
  }> = {};

  for (const p of patients) {
    // Determinar terapeuta asignado
    let terapeuta = p.medicoTratante || "";
    
    // Si no tiene médico tratante directo o es admin/genérico, buscar en sesiones
    if (!terapeuta || terapeuta.toLowerCase().includes("admin") || terapeuta.toLowerCase().includes("onix")) {
      const sessionTherapist = p.sessions.find(s => s.therapist?.name)?.therapist?.name;
      if (sessionTherapist) {
        terapeuta = sessionTherapist;
      }
    }

    if (!terapeuta) {
      terapeuta = "Sin Terapeuta Asignado";
    }

    const nac = p.fechaNacimiento ? p.fechaNacimiento.trim() : "";
    const hasNac = nac !== "" && nac !== "—";

    const emailPrincipal = p.correoPrincipal ? p.correoPrincipal.trim() : "";
    const emailLegacy = p.email ? p.email.trim() : "";
    const emailEffective = emailPrincipal || emailLegacy;
    const hasEmail = emailEffective !== "" && emailEffective !== "—";

    const faltaNacimiento = !hasNac;
    const faltaCorreo = !hasEmail;

    if (faltaNacimiento || faltaCorreo) {
      if (!byTherapist[terapeuta]) {
        byTherapist[terapeuta] = { total: 0, pacientes: [] };
      }
      byTherapist[terapeuta].pacientes.push({
        id: p.id,
        displayId: p.displayId,
        nombre: p.name,
        estatus: p.estatus || "Activo",
        nac: hasNac ? nac : "Falta",
        email: hasEmail ? emailEffective : "Falta",
        faltaNacimiento,
        faltaCorreo
      });
      byTherapist[terapeuta].total++;
    }
  }

  console.log("=== RESULTADOS ==");
  console.log(JSON.stringify(byTherapist, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
