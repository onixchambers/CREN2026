"use server";

import { prisma } from "@/lib/prisma";

export async function sendResendPaymentEmail(apiKey: string, to: string, patientName: string, balance: number, daysAgo?: number) {
  if (!apiKey) return { success: false, error: "API Key de Resend no configurada." };
  if (!to) return { success: false, error: "El paciente no tiene correo registrado." };

  const montoFormatted = balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CREN Centro de Rehabilitación <onboarding@resend.dev>",
        to: [to],
        subject: `🌿 Recordatorio de Saldo Pendiente - CREN`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #2d3748;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
              Hola! Esperamos que se encuentre muy bien. 🌿
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Le recordamos que actualmente cuenta con un saldo pendiente de <strong style="color: #e53e3e; font-size: 18px;">$${montoFormatted}</strong> en CREN.
            </p>

            <div style="background-color: #f7fafc; border-left: 4px solid #1a5276; padding: 16px; margin: 20px 0; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #1a5276; font-size: 15px;">💳 Datos de transferencia:</h3>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Banco:</strong> Banamex</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Titular:</strong> Sheribeth Mayuli Rodríguez Ríos</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>CLABE:</strong> 002180700861407112</p>
            </div>

            <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #2b6cb0;">
                📲 <strong>Envío de comprobante:</strong><br>
                Una vez realizado el pago, le pedimos enviar su comprobante al WhatsApp de Administración (<strong>55 4953 0140</strong>) indicando el nombre del paciente.
              </p>
            </div>

            <p style="font-size: 13px; color: #718096; line-height: 1.5; margin-bottom: 0;">
              Si ya realizó su pago o envió su comprobante, por favor haga caso omiso de este mensaje.<br><br>
              <strong>¡Agradecemos mucho su atención y confianza!</strong>
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Error al enviar correo con Resend" };
    }
    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error de red al conectar con Resend" };
  }
}

export async function getPendingPaymentPatients() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { name: 'asc' }
    });

    const pending = patients.filter(p => {
      let saldoVal = 0;
      if (p.notes) {
        try {
          const parsed = JSON.parse(p.notes);
          if (parsed.saldo !== undefined) saldoVal = parseFloat(parsed.saldo || "0");
        } catch (e) {}
      }
      return saldoVal > 0;
    }).map(p => {
      let saldoVal = 0;
      if (p.notes) {
        try {
          const parsed = JSON.parse(p.notes);
          if (parsed.saldo !== undefined) saldoVal = parseFloat(parsed.saldo || "0");
        } catch (e) {}
      }
      return {
        id: p.id,
        nombre: p.name,
        telefono: p.phone || "",
        correo: p.email || "",
        saldo: saldoVal
      };
    });

    return { success: true, pending };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al consultar pacientes" };
  }
}
