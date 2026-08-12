"use server";

import XLSX from "xlsx";
import fs from "fs";
import { getAsistenciasDB } from "@/app/actions/asistencia";
import { uploadFileToGoogleDrive } from "@/lib/googleDrive";

export async function exportAsistenciasToDriveAction() {
  try {
    const dbRes = await getAsistenciasDB();
    const asistencias: any[] = Array.isArray(dbRes) ? dbRes : (dbRes?.data || []);

    const headersRow = [
      "FECHA",
      "HORA",
      "TERAPEUTA",
      "ÁREA",
      "PACIENTE",
      "SEXO",
      "EDAD",
      "TIPO DE SESIÓN",
      "ESTADO",
      "FRECUENCIA",
      "MÉTODO DE PAGO",
      "PAGO",
      "FACT.",
      "SALDO",
      "SUBTOTAL",
      "IVA",
      "TOTAL",
      "OBS"
    ];

    const rows: any[][] = [headersRow];

    asistencias.forEach(a => {
      let rawFecha = a.fecha || "";
      if (rawFecha.includes("T")) rawFecha = rawFecha.split("T")[0];
      
      const dateParts = rawFecha.split("-");
      const formattedFecha = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : rawFecha;

      const row = [
        formattedFecha,
        a.horaRegistro || a.hora || "-",
        a.terapeuta || "-",
        a.area || "-",
        a.paciente || "-",
        a.sexo || "-",
        a.edad || "-",
        a.tipoSesion || "-",
        a.estado || "-",
        a.frecuencia || "Única",
        a.metodoPago || "Efectivo",
        a.pago || "SÍ",
        a.fact || "No",
        typeof a.saldo === "number" ? a.saldo : parseFloat(a.saldo || "0"),
        parseFloat((a.subtotal || "$0.00").replace(/[^0-9.-]/g, "")),
        parseFloat((a.iva || "$0.00").replace(/[^0-9.-]/g, "")),
        parseFloat((a.total || "$0.00").replace(/[^0-9.-]/g, "")),
        a.obs || "—"
      ];
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros Recientes");

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Actualizar copias locales en Escritorio
    try {
      fs.writeFileSync("C:\\Users\\onixc\\Desktop\\ALBERTO.xlsx", excelBuffer);
      fs.writeFileSync("C:\\Users\\onixc\\Desktop\\Informes PDF CREN.xlsx", excelBuffer);
    } catch (e) {}

    // Subir a Google Drive con el nombre "Informes PDF CREN.xlsx"
    const driveRes = await uploadFileToGoogleDrive(
      excelBuffer,
      "Informes PDF CREN.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Informes PDF CREN"
    );

    return driveRes;
  } catch (error: any) {
    console.error("Error al exportar Excel a Google Drive:", error);
    return { success: false, error: error?.message || "Error al exportar Excel a Google Drive." };
  }
}
