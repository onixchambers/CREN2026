import { prisma } from "../src/lib/prisma";
import { uploadFileToGoogleDrive } from "../src/lib/googleDrive";
import { generateClinicalNotePdfBase64, generateConsentPdfBase64 } from "../src/lib/pdfGenerator";

async function main() {
  console.log("=== INICIANDO SINCRO DE ARCHIVOS ANTERIORES A GOOGLE DRIVE ===");

  // 1. Sincronizar Notas Clínicas
  console.log("\n--- Buscando Notas Clínicas (Patient Documents) ---");
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      name: true,
      notes: true,
    },
  });

  console.log(`Se encontraron ${patients.length} pacientes.`);
  let totalDocsProcessed = 0;
  let totalDocsUploaded = 0;

  for (const patient of patients) {
    if (!patient.notes) continue;
    let notesObj: any = null;
    try {
      notesObj = JSON.parse(patient.notes);
    } catch (e) {
      continue;
    }

    if (!notesObj || !Array.isArray(notesObj.documents)) continue;

    let patientChanged = false;
    for (const doc of notesObj.documents) {
      totalDocsProcessed++;
      const hasDriveLink = doc.driveLink && doc.driveLink.trim().length > 0;
      
      if (!hasDriveLink) {
        console.log(`[Nota Clínica] Paciente: ${patient.name} | Tipo: ${doc.tipo} | Fecha: ${doc.fecha}`);
        try {
          const docDate = doc.fecha || new Date().toISOString().split("T")[0];
          const docTime = doc.hora || "09:00";
          const docType = doc.tipo || "Registro de Evolución";
          
          const rawDocName = (doc.terapeuta || "LOURDES RINCÓN").trim();
          const isDocNonTherapist = ["administrador", "admin", "contador", "invitado", "general"].some(kw => rawDocName.toLowerCase().includes(kw));
          const displayDocName = isDocNonTherapist ? rawDocName.replace(/^lic\.\s*/i, "") : (rawDocName.toLowerCase().startsWith("lic.") ? rawDocName : `Lic. ${rawDocName}`);

          let subfolder = "Nota Clínica";
          const tipoLower = docType.toLowerCase();
          if (tipoLower.includes("consentimiento")) {
            subfolder = "Registros de Consentimiento Firmado";
          } else if (tipoLower.includes("informe") || tipoLower.includes("visita escolar")) {
            subfolder = "Informes";
          }

          const subfolderPath = `${displayDocName}/${subfolder}`;
          const driveFolder = `Google Drive / ${displayDocName} / ${subfolder}`;

          const photosForPdf: {dataUrl: string; name: string}[] = Array.isArray(doc.photosBase64) ? doc.photosBase64 : [];
          
          const htmlBase64 = generateClinicalNotePdfBase64(patient.name, {
            fecha: docDate,
            hora: docTime,
            tipo: docType,
            terapeuta: displayDocName,
            contenido: doc.contenido || {},
          }, photosForPdf);

          const fileBuffer = Buffer.from(htmlBase64, "base64");
          const cleanPatientName = (patient.name || "Paciente").replace(/\s+/g, "_");
          const cleanDocType = docType.replace(/\s+/g, "_");
          const fileName = `${cleanDocType}_${cleanPatientName}_${docDate.replace(/-/g, "")}.pdf`;

          console.log(`Subiendo nota a Google Drive: ${subfolderPath}/${fileName}...`);
          const driveRes = await uploadFileToGoogleDrive(fileBuffer, fileName, "application/pdf", subfolderPath);

          if (driveRes.success && driveRes.webViewLink) {
            doc.driveLink = driveRes.webViewLink;
            doc.driveFolder = driveFolder;
            patientChanged = true;
            totalDocsUploaded++;
            console.log(`✅ Subido exitosamente: ${driveRes.webViewLink}`);
          } else {
            console.error(`❌ Error al subir: ${driveRes.error || "Desconocido"}`);
          }
        } catch (err: any) {
          console.error(`❌ Excepción al procesar nota: ${err.message || err}`);
        }
      }
    }

    if (patientChanged) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { notes: JSON.stringify(notesObj) },
      });
      console.log(`✅ Notas actualizadas en la base de datos para el paciente: ${patient.name}`);
    }
  }

  // 2. Sincronizar Registros de Consentimiento firmados por QR
  console.log("\n--- Buscando Registros por QR (Pre-Registrations) ---");
  const preRegistrations = await prisma.preRegistration.findMany({
    where: {
      AND: [
        { signatureDataUrl: { not: null } },
        { signatureDataUrl: { not: "" } },
      ],
    },
  });

  console.log(`Se encontraron ${preRegistrations.length} registros por QR firmados.`);
  let totalQrProcessed = 0;
  let totalQrUploaded = 0;

  for (const pre of preRegistrations) {
    totalQrProcessed++;
    console.log(`[Registro QR] Paciente: ${pre.name} | Médico: ${pre.medicoTratante || "Administrador"}`);
    try {
      const rawDocName = (pre.medicoTratante || "Administrador").trim();
      const isDocNonTherapist = ["administrador", "admin", "contador", "invitado", "general"].some(kw => rawDocName.toLowerCase().includes(kw));
      const displayDocName = isDocNonTherapist ? rawDocName.replace(/^lic\.\s*/i, "") : (rawDocName.toLowerCase().startsWith("lic.") ? rawDocName : `Lic. ${rawDocName}`);

      const htmlBase64 = generateConsentPdfBase64({
        pacienteNombre: pre.name,
        fechaNacimiento: pre.fechaNacimiento || undefined,
        sexo: pre.sexo || undefined,
        medicoTratante: pre.medicoTratante || undefined,
        escuela: pre.escuela || undefined,
        madreNombre: pre.madreNombre || undefined,
        madreContacto: pre.madreContacto || undefined,
        padreNombre: pre.padreNombre || undefined,
        padreContacto: pre.padreContacto || undefined,
        correoPrincipal: pre.correoPrincipal || undefined,
        signatureDataUrl: pre.signatureDataUrl || undefined,
        cryptoHash: pre.cryptoHash || undefined,
        signedAt: pre.updatedAt?.toISOString() || pre.createdAt?.toISOString() || undefined,
        ipAddress: pre.ipAddress || undefined,
        userAgent: pre.userAgent || undefined,
        pdfUrl: `Informes PDF CREN / ${displayDocName} Protección de Datos`,
      });

      const fileBuffer = Buffer.from(htmlBase64, "base64");
      const subfolderName = `${displayDocName}/Registros de Consentimiento Firmado`;
      const fileName = `Firma_Digital_${(pre.name || "Paciente").replace(/\s+/g, "_")}.pdf`;

      console.log(`Subiendo consentimiento a Google Drive: ${subfolderName}/${fileName}...`);
      const driveRes = await uploadFileToGoogleDrive(fileBuffer, fileName, "application/pdf", subfolderName);

      if (driveRes.success && driveRes.webViewLink) {
        totalQrUploaded++;
        console.log(`✅ Subido exitosamente: ${driveRes.webViewLink}`);
      } else {
        console.error(`❌ Error al subir: ${driveRes.error || "Desconocido"}`);
      }
    } catch (err: any) {
      console.error(`❌ Excepción al procesar registro QR: ${err.message || err}`);
    }
  }

  console.log("\n=== RESUMEN DE PROCESO ===");
  console.log(`Notas Clínicas procesadas: ${totalDocsProcessed}`);
  console.log(`Notas Clínicas subidas: ${totalDocsUploaded}`);
  console.log(`Registros QR procesados: ${totalQrProcessed}`);
  console.log(`Registros QR subidos: ${totalQrUploaded}`);
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("Error crítico en la ejecución del script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
