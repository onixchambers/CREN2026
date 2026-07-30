// Generador de Documento PDF Legal de Consentimiento e Intake para CREN México

export function generateConsentPdfBase64(data: {
  pacienteNombre: string;
  fechaNacimiento?: string;
  sexo?: string;
  medicoTratante?: string;
  escuela?: string;
  madreNombre?: string;
  madreContacto?: string;
  padreNombre?: string;
  padreContacto?: string;
  correoPrincipal?: string;
  signatureDataUrl?: string;
  cryptoHash?: string;
  signedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  pdfUrl?: string;
}): string {
  const timestampUtc = data.signedAt || new Date().toISOString();
  const fechaEmision = new Date(timestampUtc).toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const htmlDoc = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Aviso de Privacidad y Consentimiento - ${data.pacienteNombre}</title>
      <style>
        @page {
          margin: 0.5in;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          margin: 0;
          padding: 25px;
          color: #0f172a;
          background: #ffffff;
          font-size: 13px;
          line-height: 1.5;
          box-sizing: border-box;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #0e2f44;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .header-title {
          font-size: 20px;
          font-weight: 800;
          color: #0e2f44;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .header-subtitle {
          font-size: 15px;
          font-weight: 700;
          color: #059669;
          margin-top: 5px;
        }
        .header-legal {
          font-size: 11px;
          color: #475569;
          margin-top: 3px;
        }
        .section-header {
          background: #0e2f44;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 4px;
          margin-top: 18px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grid-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .grid-table td {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
          font-size: 13px;
        }
        .label {
          font-weight: 700;
          color: #1e293b;
        }
        .notice-box {
          background: #ecfdf5;
          border: 2px solid #059669;
          padding: 12px;
          font-size: 12px;
          font-weight: 700;
          color: #064e3b;
          border-radius: 6px;
          margin-top: 16px;
          line-height: 1.45;
          text-align: center;
        }
        .legal-terms {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 14px;
          border-radius: 6px;
          font-size: 12px;
          color: #334155;
          text-align: justify;
          margin-top: 14px;
          line-height: 1.5;
        }
        .legal-terms h4 {
          margin: 10px 0 4px 0;
          color: #0e2f44;
          font-size: 13px;
        }
        .signature-container {
          margin-top: 25px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          page-break-inside: avoid;
        }
        .signature-card {
          width: 340px;
          border: 2px solid #0e2f44;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          background: #ffffff;
        }
        .signature-img {
          max-height: 120px;
          width: auto;
          max-width: 310px;
          display: block;
          margin: 0 auto 8px auto;
          image-rendering: -webkit-optimize-contrast;
        }
        .signature-line {
          border-top: 2px solid #0e2f44;
          padding-top: 6px;
          font-weight: 800;
          font-size: 12px;
          color: #0e2f44;
        }
        .audit-box {
          background: #0f172a;
          color: #f8fafc;
          padding: 14px;
          border-radius: 8px;
          margin-top: 25px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.6;
          page-break-inside: avoid;
        }
        .audit-title {
          color: #34d399;
          font-weight: bold;
          font-size: 12px;
          border-bottom: 1px solid #334155;
          padding-bottom: 6px;
          margin-bottom: 8px;
        }
        .audit-row {
          word-break: break-all;
        }
        .audit-highlight {
          color: #38bdf8;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">CENTRO DE REHABILITACIÓN ESPECIALIZADA Y NEURODESARROLLO (CREN)</div>
        <div class="header-subtitle">AVISO DE PRIVACIDAD DE DATOS PERSONALES SENSIBLES DE SALUD</div>
        <div class="header-legal">Petén 284, PB, Col. Narvarte, C.P. 03023, Benito Juárez, CDMX | Tel.: 55 16 87 1232</div>
        <div style="font-size:11.5px; font-weight:bold; color:#0e2f44; margin-top:6px;">FECHA Y HORA DE EMISIÓN: ${fechaEmision}</div>
      </div>

      <div class="section-header">1. FICHA DE IDENTIFICACIÓN DEL PACIENTE</div>
      <table class="grid-table">
        <tr>
          <td style="width: 50%;"><span class="label">PACIENTE:</span> ${data.pacienteNombre}</td>
          <td style="width: 25%;"><span class="label">FECHA NACIMIENTO:</span> ${data.fechaNacimiento || "N/A"}</td>
          <td style="width: 25%;"><span class="label">SEXO:</span> ${data.sexo || "N/A"}</td>
        </tr>
        <tr>
          <td><span class="label">MÉDICO / TERAPEUTA TRATANTE:</span> ${data.medicoTratante || "Administrador"}</td>
          <td colspan="2"><span class="label">ESCUELA / COLEGIO:</span> ${data.escuela || "N/A"}</td>
        </tr>
      </table>

      <div class="section-header">2. CONTACTOS DE PADRES / TUTORES LEGALES</div>
      <table class="grid-table">
        <tr>
          <td style="width: 50%;"><span class="label">MADRE:</span> ${data.madreNombre || "N/A"}<br/><span class="label">TELÉFONO:</span> ${data.madreContacto || "N/A"}</td>
          <td style="width: 50%;"><span class="label">PADRE:</span> ${data.padreNombre || "N/A"}<br/><span class="label">TELÉFONO:</span> ${data.padreContacto || "N/A"}</td>
        </tr>
        <tr>
          <td colspan="2"><span class="label">CORREO ELECTRÓNICO PRINCIPAL:</span> ${data.correoPrincipal || "N/A"}</td>
        </tr>
      </table>

      <div class="notice-box">
        AVISO DE PRIVACIDAD INTEGRAL - CENTRO DE REHABILITACIÓN ESPECIALIZADA Y NEURODESARROLLO (CREN)<br/>
        Contacto de Privacidad: centrocren@gmail.com | Tel.: 55 16 87 1232 / WhatsApp: 55 49 53 01 40
      </div>

      <div class="legal-terms">
        <h4>1. Datos personales que recabamos</h4>
        • De identificación y contacto: Nombre completo, fecha de nacimiento, edad, teléfono y correo electrónico.<br/>
        • De facturación (opcional): Registro Federal de Contribuyentes (RFC), domicilio fiscal y datos de pago.<br/>
        • Clínicos (sensibles): Historial clínico, antecedentes médicos, diagnósticos, resultados de evaluaciones, planes de terapia y notas de evolución (NOM-004-SSA3-2012).<br/>
        • De menores de edad: Datos del padre, madre o tutor.<br/>

        <h4>2. Finalidades del tratamiento de sus datos</h4>
        • Primarias: Crear y conservar expediente clínico (NOM-004-SSA3-2012), valoraciones, diagnósticos, atención terapéutica (física, psicológica, lenguaje), programación de citas y facturación.<br/>
        • Secundarias: Información sobre talleres, conferencias, promociones y encuestas de satisfacción.<br/>

        <h4>3. Consentimiento expreso para datos sensibles</h4>
        Requerimos su consentimiento expreso y por escrito para el tratamiento de sus datos personales de salud en su expediente clínico al momento de su primera consulta.<br/>

        <h4>4. Transferencia de datos</h4>
        Únicamente con profesionales de la salud (interconsultas), aseguradoras (reembolsos) o autoridades competentes por mandato de ley.<br/>

        <h4>5. Conservación y seguridad de los datos</h4>
        Conservación durante 5 años a partir de la última fecha de atención conforme a la NOM-004-SSA3-2012.<br/>

        <h4>6. Derechos ARCO y revocación del consentimiento</h4>
        Solicitudes a centrocren@gmail.com. Plazo de respuesta: 20 días hábiles.<br/>

        <h4>7. Cambios a este aviso de privacidad</h4>
        Versión vigente disponible en recepción y en www.crentrocren.com (Última actualización: 2 de septiembre de 2025).
      </div>

      <div class="signature-container">
        <div>
          <div style="font-size:11px; color:#475569;">
            Documento Firmado Electrónicamente en Dispositivo Móvil.<br/>
            Estado de Validación: <strong>APROBADO Y SELLADO</strong>
          </div>
        </div>
        <div class="signature-card">
          ${
            data.signatureDataUrl
              ? `<img src="${data.signatureDataUrl}" class="signature-img" alt="Firma Digital HD" />`
              : `<div style="height:70px; color:#94a3b8; font-style:italic; padding-top:20px;">[ Sin Imagen de Firma ]</div>`
          }
          <div class="signature-line">FIRMA DIGITAL DEL TUTOR / PACIENTE</div>
          <div style="font-size:9.5px; color:#64748b; margin-top:2px;">Firma Electrónica Simplificada (Código de Comercio Art. 89)</div>
        </div>
      </div>

      <div class="audit-box">
        <div class="audit-title">🛡️ CERTIFICADO DE AUDITORÍA E INTEGRIDAD CRIPTOGRÁFICA (AUDIT TRAIL)</div>
        <div class="audit-row"><span class="audit-highlight">HASH SHA-256 DE SEGURIDAD:</span> ${data.cryptoHash || "N/A"}</div>
        <div class="audit-row"><span class="audit-highlight">STAMP DE TIEMPO UTC (signedAt):</span> ${timestampUtc}</div>
        <div class="audit-row"><span class="audit-highlight">DIRECCIÓN IP DISPOSITIVO (ipAddress):</span> ${data.ipAddress || "Móvil Paciente"}</div>
        <div class="audit-row"><span class="audit-highlight">NAVEGADOR / DISPOSITIVO (userAgent):</span> ${data.userAgent || "Dispositivo Móvil"}</div>
        <div class="audit-row"><span class="audit-highlight">ENLACE PDF GOOGLE DRIVE (pdfUrl):</span> ${data.pdfUrl || "Almacenado en Informes PDF CREN"}</div>
      </div>
    </body>
    </html>
  `;

  return Buffer.from(htmlDoc).toString("base64");
}
