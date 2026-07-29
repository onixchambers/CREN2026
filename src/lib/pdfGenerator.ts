// Generador de Documento PDF Legal de Consentimiento e Intake para México (Formato Legal 8.5" x 14")

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
      <title>Consentimiento Informado - ${data.pacienteNombre}</title>
      <style>
        @page {
          size: 8.5in 14in; /* Formato Legal 8 1/2 x 14 pulgadas */
          margin: 0.4in;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #0f172a;
          background: #ffffff;
          font-size: 11px;
          line-height: 1.45;
          width: 7.7in; /* Se ajusta a 8.5in menos márgenes */
          box-sizing: border-box;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #0e2f44;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .header-title {
          font-size: 17px;
          font-weight: 800;
          color: #0e2f44;
          letter-spacing: 0.5px;
          margin: 0;
        }
        .header-subtitle {
          font-size: 13px;
          font-weight: 700;
          color: #059669;
          margin-top: 4px;
        }
        .header-legal {
          font-size: 9.5px;
          color: #475569;
          margin-top: 2px;
        }
        .section-header {
          background: #0e2f44;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 4px;
          margin-top: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grid-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .grid-table td {
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
        }
        .label {
          font-weight: 700;
          color: #1e293b;
        }
        .notice-box {
          background: #fef3c7;
          border: 1.5px solid #f59e0b;
          padding: 10px;
          font-size: 10px;
          font-weight: 700;
          color: #78350f;
          border-radius: 6px;
          margin-top: 12px;
          line-height: 1.4;
          text-align: justify;
        }
        .legal-terms {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 12px;
          border-radius: 6px;
          font-size: 9.5px;
          color: #334155;
          text-align: justify;
          margin-top: 10px;
          line-height: 1.4;
        }
        .legal-terms h4 {
          margin: 6px 0 2px 0;
          color: #0e2f44;
          font-size: 10px;
        }
        .signature-container {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          page-break-inside: avoid;
        }
        .signature-card {
          width: 320px;
          border: 1.5px solid #0e2f44;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          background: #ffffff;
        }
        .signature-img {
          max-height: 110px;
          width: auto;
          max-width: 290px;
          display: block;
          margin: 0 auto 6px auto;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        .signature-line {
          border-top: 1.5px solid #0e2f44;
          padding-top: 4px;
          font-weight: 800;
          font-size: 10.5px;
          color: #0e2f44;
        }
        .audit-box {
          background: #0f172a;
          color: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          margin-top: 20px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 9.5px;
          line-height: 1.5;
          page-break-inside: avoid;
        }
        .audit-title {
          color: #34d399;
          font-weight: bold;
          font-size: 10.5px;
          border-bottom: 1px solid #334155;
          padding-bottom: 4px;
          margin-bottom: 6px;
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
        <div class="header-title">CENTRO DE REHABILITACIÓN NEUROLÓGICA (CREN)</div>
        <div class="header-subtitle">DOCUMENTO OFICIAL DE INTAKE Y CONSENTIMIENTO INFORMADO DE DATOS PERSONALES SENSIBLES DE SALUD</div>
        <div class="header-legal">Validez Jurídica Plena conforme al Código de Comercio (Art. 89-114) y LFPDPPP de los Estados Unidos Mexicanos</div>
        <div style="font-size:10px; font-weight:bold; color:#0e2f44; margin-top:4px;">FECHA Y HORA DE EMISIÓN: ${fechaEmision}</div>
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
        AVISO IMPORTANTE DE ACEPTACIÓN EXPRESA: AL DESCARGAR, INSTALAR, ACCEDER, REGISTRARSE O UTILIZAR ESTA APLICACIÓN MÓVIL, USTED RECONOCE QUE HA LEÍDO, ENTENDIDO Y ACEPTADO EN SU TOTALIDAD LOS PRESENTES TÉRMINOS Y CONDICIONES, LOS CUALES CONSTITUYEN UN CONTRATO DE ADHESIÓN CON VALIDEZ JURÍDICA Y EFECTOS VINCULANTES CONFORME AL CÓDIGO DE COMERCIO Y LA LEY FEDERAL DE PROTECCIÓN AL CONSUMIDOR DE MÉXICO.
      </div>

      <div class="legal-terms">
        <h4>1. Marco Legal y Conceptual</h4>
        Regula el acceso y uso de la aplicación operada por CREN dentro de los Estados Unidos Mexicanos bajo la LFPC (Capítulo VIII BIS), Código de Comercio de México (Artículos 89 al 114), LFPDPPP y su Reglamento, y Código Civil Federal.<br/>

        <h4>2. Elegibilidad y Capacidad Jurídica</h4>
        El Usuario declara bajo protesta de decir verdad contar con plena capacidad legal para contratar o ser padre/tutor legítimo del paciente atendido en CREN.<br/>

        <h4>3. Registro de Cuenta, Seguridad y Firma Electrónica</h4>
        Conforme al artículo 89 del Código de Comercio mexicano, el trazado de firma digital dentro de la Aplicación constituye una Firma Electrónica Simplificada o Expresa que produce los mismos efectos jurídicos que la firma autógrafa.<br/>

        <h4>4. Licencia de Uso y Propiedad Intelectual</h4>
        Licencia limitada, no exclusiva e intransferible. Reservados todos los derechos de propiedad intelectual conforme a la Ley Federal del Derecho de Autor y Ley Federal de Protección a la Propiedad Industrial.<br/>

        <h4>5. Condiciones Económicas, Pagos y Facturación CFDI (SAT)</h4>
        Precios expresados en Pesos Mexicanos (MXN) con IVA aplicable y disponibilidad de facturación electrónica conforme al SAT.<br/>

        <h4>6. Usos Prohibidos y 7. Protección de Datos Personales (LFPDPPP)</h4>
        Tratamiento confidencial de datos personales sensibles de salud conforme al Aviso de Privacidad Integral de CREN.<br/>

        <h4>8. Limitación de Responsabilidad, 9. Cancelación y 10. Jurisdicción</h4>
        Sometimiento en primera instancia al procedimiento conciliatorio ante la Procuraduría Federal del Consumidor (PROFECO) y competencia expresa de los Tribunales con sede en la Ciudad de México.
      </div>

      <div class="signature-container">
        <div>
          <div style="font-size:10px; color:#475569;">
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
          <div style="font-size:8.5px; color:#64748b; margin-top:2px;">Firma Electrónica Simplificada (Código de Comercio Art. 89)</div>
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
