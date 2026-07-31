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

    let finalPath = "";
    if (cleanName && !isNonTherapist && !lowerName.startsWith("lic.")) {
      // Solo agregar 'Lic.' cuando corresponda a usuarios registrados como Terapeuta
      finalPath = `Lic. ${cleanName}`;
    } else if (isNonTherapist) {
      // Mantener nombre limpio sin 'Lic.' para Administrador, Contador e Invitado
      finalPath = cleanName.replace(/^lic\.\s*/i, "");
    } else {
      finalPath = cleanName;
    }

    // Guardar en la subcarpeta "Informes"
    const subfolderPath = `${finalPath}/Informes`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res = await uploadFileToGoogleDrive(buffer, file.name, file.type || "application/pdf", subfolderPath);
    return res;
  } catch (error: any) {
    console.error("Error in uploadInformePDFToDrive action:", error);
    return { success: false, error: error?.message || "Error al subir a Google Drive" };
  }
}

export async function uploadConsentPDFAction(data: { htmlBase64: string; fileName: string; terapeutaName: string }) {
  try {
    const { htmlBase64, fileName, terapeutaName } = data;
    if (!htmlBase64) return { success: false, error: "No base64 data" };

    const buffer = Buffer.from(htmlBase64, "base64");
    const res = await uploadFileToGoogleDrive(buffer, fileName, "application/pdf", terapeutaName);
    return res;
  } catch (error: any) {
    console.error("Error in uploadConsentPDFAction:", error);
    return { success: false, error: error?.message || "Error al subir PDF a Google Drive" };
  }
}
