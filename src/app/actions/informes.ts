"use server";

import { uploadFileToGoogleDrive } from "@/lib/googleDrive";

export async function uploadInformePDFToDrive(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    let terapeutaName = (formData.get("terapeutaName") as string) || "General";

    if (!file) {
      return { success: false, error: "No se recibió ningún archivo." };
    }

    const cleanName = terapeutaName.trim();
    const lowerName = cleanName.toLowerCase();

    // Palabras clave de roles que NO deben llevar el prefijo 'Lic.'
    const nonTherapistKeywords = ["administrador", "admin", "contador", "invitado", "general", "sistema"];
    const isNonTherapist = nonTherapistKeywords.some(kw => lowerName.includes(kw));

    if (cleanName && !isNonTherapist && !lowerName.startsWith("lic.")) {
      // Solo agregar 'Lic.' cuando corresponda a usuarios registrados como Terapeuta
      terapeutaName = `Lic. ${cleanName}`;
    } else if (isNonTherapist) {
      // Mantener nombre limpio sin 'Lic.' para Administrador, Contador e Invitado
      terapeutaName = cleanName.replace(/^lic\.\s*/i, "");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res = await uploadFileToGoogleDrive(buffer, file.name, file.type || "application/pdf", terapeutaName);
    return res;
  } catch (error: any) {
    console.error("Error in uploadInformePDFToDrive action:", error);
    return { success: false, error: error?.message || "Error al subir a Google Drive" };
  }
}
