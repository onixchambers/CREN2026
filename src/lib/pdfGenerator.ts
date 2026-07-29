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
  const timestamp = data.signedAt || new Date().toISOString();
  const htmlDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; margin: 25px; color: #1e293b; font-size: 11px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
        .title { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px; }
        .section-title { font-size: 12px; font-weight: bold; color: #1a5276; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 12px; margin-bottom: 6px; }
        .grid { display: flex; flex-wrap: wrap; margin-bottom: 8px; }
        .col { flex: 1; min-width: 45%; margin-bottom: 4px; }
        .label { font-weight: bold; color: #475569; }
        .legal-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 8px; font-weight: bold; margin-top: 10px; font-size: 10px; border-radius: 4px; }
        .legal-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-size: 9.5px; text-align: justify; margin-top: 10px; }
        .signature-box { border: 1px solid #0f172a; padding: 10px; text-align: center; margin-top: 15px; width: 240px; }
        .audit-trail { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 9px; padding: 8px; border-radius: 6px; margin-top: 15px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="font-size:16px; font-weight:bold; color:#0f172a;">CENTRO DE REHABILITACIÓN NEUROLÓGICA (CREN)</div>
        <div class="title">TÉRMINOS Y CONDICIONES DE USO Y CONSENTIMIENTO INFORMADO DE DATOS PERSONALES SENSIBLES DE SALUD</div>
        <div style="font-size:9.5px; color:#64748b;">Marco Jurídico Aplicable en los Estados Unidos Mexicanos</div>
      </div>

      <div class="section-title">1. DATOS DEL PACIENTE</div>
      <div class="grid">
        <div class="col"><span class="label">Paciente:</span> ${data.pacienteNombre}</div>
        <div class="col"><span class="label">Fecha Nacimiento:</span> ${data.fechaNacimiento || "N/A"}</div>
        <div class="col"><span class="label">Sexo:</span> ${data.sexo || "N/A"}</div>
        <div class="col"><span class="label">Terapeuta / Médico:</span> ${data.medicoTratante || "Administrador"}</div>
        <div class="col"><span class="label">Escuela:</span> ${data.escuela || "N/A"}</div>
      </div>

      <div class="section-title">2. CONTACTOS PRINCIPALES Y REGISTRO</div>
      <div class="grid">
        <div class="col"><span class="label">Madre:</span> ${data.madreNombre || "N/A"} (${data.madreContacto || "N/A"})</div>
        <div class="col"><span class="label">Padre:</span> ${data.padreNombre || "N/A"} (${data.padreContacto || "N/A"})</div>
        <div class="col"><span class="label">Correo Electrónico:</span> ${data.correoPrincipal || "N/A"}</div>
      </div>

      <div class="legal-notice">
        AVISO IMPORTANTE DE ACEPTACIÓN EXPRESA: AL DESCARGAR, INSTALAR, ACCEDER, REGISTRARSE O UTILIZAR ESTA APLICACIÓN MÓVIL, USTED RECONOCE QUE HA LEÍDO, ENTENDIDO Y ACEPTADO EN SU TOTALIDAD LOS PRESENTES TÉRMINOS Y CONDICIONES, LOS CUALES CONSTITUYEN UN CONTRATO DE ADHESIÓN CON VALIDEZ JURÍDICA Y EFECTOS VINCULANTES CONFORME AL CÓDIGO DE COMERCIO Y LA LEY FEDERAL DE PROTECCIÓN AL CONSUMIDOR DE MÉXICO.
      </div>

      <div class="legal-box">
        <strong>1. Marco Legal y Conceptual:</strong> Regula el acceso y uso de la Aplicación operada por CREN en México bajo la LFPC, Código de Comercio (Art. 89-114), LFPDPPP y Código Civil Federal.<br/>
        <strong>2. Elegibilidad y Capacidad Jurídica:</strong> El Usuario declara contar con capacidad legal para contratar o ser tutor legítimo del menor atendido.<br/>
        <strong>3. Registro de Cuenta y Firma Electrónica:</strong> Conforme al Art. 89 del Código de Comercio, el trazado de firma digital constituye una Firma Electrónica Simplificada o Expresa que produce los mismos efectos jurídicos que la firma autógrafa.<br/>
        <strong>4. Propiedad Intelectual:</strong> Licencia limitada y personal de uso. Reservados todos los derechos sobre la plataforma.<br/>
        <strong>5. Condiciones Económicas y SAT:</strong> Precios en Pesos Mexicanos (MXN) con IVA e integración de facturación CFDI.<br/>
        <strong>6. Usos Prohibidos y 7. Protección de Datos:</strong> Tratamiento riguroso de Datos Sensibles conforme a la LFPDPPP.<br/>
        <strong>8. Limitación de Responsabilidad, 9. Modificaciones y 10. Jurisdicción:</strong> Conciliación en primera instancia ante PROFECO y sometimiento expreso a los Tribunales de la Ciudad de México.
      </div>

      <div style="margin-top:15px; display:flex; justify-content:space-between;">
        <div class="signature-box">
          ${data.signatureDataUrl ? `<img src="${data.signatureDataUrl}" style="max-height:75px; max-width:220px;" /><br/>` : `<div style="height:55px;"></div>`}
          <div style="border-top:1px solid #0f172a; margin-top:4px; font-weight:bold; font-size:10px;">FIRMA DIGITAL DEL TUTOR / PACIENTE</div>
        </div>
      </div>

      <div class="audit-trail">
        <strong>REGISTRO DE AUDITORÍA E INTEGRIDAD CRIPTOGRÁFICA (AUDIT TRAIL)</strong><br/>
        HASH SHA-256 DE SEGURIDAD: ${data.cryptoHash || "N/A"}<br/>
        MARCA DE TIEMPO UTC: ${timestamp}<br/>
        DIRECCIÓN IP DISPOSITIVO: ${data.ipAddress || "Móvil Paciente"}
      </div>
    </body>
    </html>
  `;

  return Buffer.from(htmlDoc).toString("base64");
}
