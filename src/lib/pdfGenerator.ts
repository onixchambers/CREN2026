// Generador de Documento PDF Legal de Consentimiento e Intake para México

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
}): string {
  // Simple PDF generator or text/HTML payload for Google Drive PDF conversion
  const timestamp = data.signedAt || new Date().toISOString();
  const htmlDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 12px; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 5px; }
        .section-title { font-size: 13px; font-weight: bold; color: #059669; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 15px; margin-bottom: 8px; }
        .grid { display: flex; flex-wrap: wrap; margin-bottom: 10px; }
        .col { flex: 1; min-width: 45%; margin-bottom: 6px; }
        .label { font-weight: bold; color: #475569; }
        .legal-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-size: 10px; text-align: justify; margin-top: 15px; }
        .signature-box { border: 1px solid #0f172a; padding: 10px; text-align: center; margin-top: 20px; width: 250px; }
        .audit-trail { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 9px; padding: 10px; border-radius: 6px; margin-top: 20px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="font-size:18px; font-weight:bold; color:#0f172a;">CENTRO DE REHABILITACIÓN NEUROLÓGICA (CREN)</div>
        <div class="title">CONSENTIMIENTO INFORMADO DE DATOS PERSONALES SENSIBLES DE SALUD</div>
        <div style="font-size:10px; color:#64748b;">Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y Código de Comercio de México</div>
      </div>

      <div class="section-title">1. DATOS DEL PACIENTE</div>
      <div class="grid">
        <div class="col"><span class="label">Paciente:</span> ${data.pacienteNombre}</div>
        <div class="col"><span class="label">Fecha Nacimiento:</span> ${data.fechaNacimiento || "N/A"}</div>
        <div class="col"><span class="label">Sexo:</span> ${data.sexo || "N/A"}</div>
        <div class="col"><span class="label">Terapeuta / Médico:</span> ${data.medicoTratante || "Administrador"}</div>
        <div class="col"><span class="label">Escuela:</span> ${data.escuela || "N/A"}</div>
      </div>

      <div class="section-title">2. CONTACTOS PRINCIPALES Y ALERTAS</div>
      <div class="grid">
        <div class="col"><span class="label">Madre:</span> ${data.madreNombre || "N/A"} (${data.madreContacto || "N/A"})</div>
        <div class="col"><span class="label">Padre:</span> ${data.padreNombre || "N/A"} (${data.padreContacto || "N/A"})</div>
        <div class="col"><span class="label">Correo Electrónico:</span> ${data.correoPrincipal || "N/A"}</div>
      </div>

      <div class="section-title">3. ACEPTACIÓN LEGAL Y MARCO JURÍDICO (MÉXICO)</div>
      <div class="legal-box">
        <strong>AVISO IMPORTANTE DE ACEPTACIÓN EXPRESA:</strong> El Usuario/Tutor reconoce haber leído y aceptado en su totalidad el presente Consentimiento Informado de Datos Sensibles de Salud y Atención Médica en CREN.<br/><br/>
        En términos del artículo 89 y demás relativos del Código de Comercio de México, la aceptación mediante firma digital táctil constituye una <strong>Firma Electrónica Simplificada o Expresa</strong> que produce los mismos efectos jurídicos que la firma autógrafa, garantizando la autenticidad e integridad del consentimiento prestado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
      </div>

      <div style="margin-top:20px; display:flex; justify-content:space-between;">
        <div class="signature-box">
          ${data.signatureDataUrl ? `<img src="${data.signatureDataUrl}" style="max-height:80px; max-width:200px;" /><br/>` : `<div style="height:60px;"></div>`}
          <div style="border-top:1px solid #0f172a; margin-top:5px; font-weight:bold; font-size:11px;">FIRMA DIGITAL DEL TUTOR / PACIENTE</div>
        </div>
      </div>

      <div class="audit-trail">
        <strong>REGISTRO DE AUDITORÍA E INTEGRIDAD CRIPTOGRÁFICA (AUDIT TRAIL)</strong><br/>
        HASH SHA-256 DE SEGURIDAD: ${data.cryptoHash || "N/A"}<br/>
        MARCA DE TIEMPO UTC: ${timestamp}<br/>
        DIRECCIÓN IP: ${data.ipAddress || "Móvil Paciente"}
      </div>
    </body>
    </html>
  `;

  // Convert HTML to base64 buffer for API upload
  return Buffer.from(htmlDoc).toString("base64");
}
