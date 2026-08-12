import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { getAsistenciasDB } from "../src/app/actions/asistencia";
import { uploadFileToGoogleDrive } from "../src/lib/googleDrive";

export async function generateAndUploadExcel() {
  console.log("1. Fetching asistencia records from DB...");
  const dbRes = await getAsistenciasDB();
  const asistencias: any[] = Array.isArray(dbRes) ? dbRes : (dbRes?.data || []);
  console.log(`Found ${asistencias.length} records.`);

  // Headers matching Registros Recientes / ALBERTO.xlsx
  const headersRow1 = [
    "", "", "", "ÁREA", "", "SEXO", "EDAD", "", "", "FRECUENCIA", "", "PAGO", "", "SALDO", "SUBTOTAL"
  ];
  const headersRow2 = [
    "FECHA", "HORA", "TERAPEUTA", "ÁREA", "PACIENTE", "SEXO", "EDAD", "TIPO DE SESIÓN", "ESTADO", "FRECUENCIA", "MÉTODO DE PAGO", "PAGO", "FACT.", "SALDO", "SUBTOTAL", "IVA", "TOTAL", "OBS"
  ];

  const rows: any[][] = [headersRow2];

  asistencias.forEach(a => {
    let rawFecha = a.fecha || "";
    if (rawFecha.includes("T")) rawFecha = rawFecha.split("T")[0];
    
    // Format fecha DD/MM/YYYY or YYYY-MM-DD
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

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registros Recientes");

  // Write Buffer
  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Update Desktop files
  const desktopPath = "C:\\Users\\onixc\\Desktop\\ALBERTO.xlsx";
  const desktopPath2 = "C:\\Users\\onixc\\Desktop\\Informes PDF CREN.xlsx";
  try {
    fs.writeFileSync(desktopPath2, excelBuffer);
    console.log("Saved 'Informes PDF CREN.xlsx' to Desktop successfully.");
  } catch (err) {
    console.warn("Could not update Informes PDF CREN.xlsx on Desktop:", err);
  }
  try {
    fs.writeFileSync(desktopPath, excelBuffer);
    console.log("Saved 'ALBERTO.xlsx' to Desktop successfully.");
  } catch (err) {
    console.warn("Could not update ALBERTO.xlsx on Desktop (file may be open in Excel):", err);
  }

  // Upload to Google Drive with file name "Informes PDF CREN.xlsx"
  console.log("Uploading to Google Drive as 'Informes PDF CREN.xlsx'...");
  const driveResult = await uploadFileToGoogleDrive(
    excelBuffer,
    "Informes PDF CREN.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Informes PDF CREN"
  );

  console.log("Google Drive result:", driveResult);
  return driveResult;
}

generateAndUploadExcel()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error running sync:", err);
    process.exit(1);
  });
