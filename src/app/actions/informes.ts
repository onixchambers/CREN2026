"use server";

import { uploadFileToGoogleDrive } from "@/lib/googleDrive";

export async function uploadInformePDFToDrive(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    let terapeutaName = (formData.get("terapeutaName") as string) || "General";

    if (!file) {
      return { success: false, error: "No se recibió ningún archivo." };
    }

    // Asegurar que la carpeta del terapeuta siempre inicie con 'Lic.' (ej. Lic. Karla, Lic. Fernanda)
    const cleanName = terapeutaName.trim();
    if (cleanName && !cleanName.toLowerCase().startsWith("lic.")) {
      terapeutaName = `Lic. ${cleanName}`;
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
