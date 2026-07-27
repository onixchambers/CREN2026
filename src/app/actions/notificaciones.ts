"use server";

import { prisma } from "@/lib/prisma";

export async function sendResendPaymentEmail(apiKey: string, to: string, patientName: string, balance: number, daysAgo: number) {
  if (!apiKey) return { success: false, error: "API Key de Resend no configurada." };
  if (!to) return { success: false, error: "El paciente no tiene correo registrado." };

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
        subject: `⚠️ Recordatorio de Saldo Pendiente - CREN`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #1a5276; margin-top: 0;">Estimado(a) ${patientName},</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Le recordamos cordialmente que tiene un saldo pendiente de pago por concepto de sesiones en el <strong>Centro de Rehabilitación CREN</strong>.
            </p>
            <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #7b341e;"><strong>Monto Pendiente:</strong> $${balance.toFixed(2)} MXN</p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #9c4221;">Agradecemos realizar su pago a la brevedad para mantener al día su expediente.</p>
            </div>
            <p style="color: #718096; font-size: 13px; margin-top: 30px;">
              Si ya realizó su pago, por favor omita este mensaje o envíe su comprobante.<br>
              Atentamente,<br>
              <strong>Dirección Administrativa - CREN</strong>
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
      orderBy: { nombre: 'asc' }
    });

    const pending = patients.filter(p => {
      const s = typeof p.saldo === "number" ? p.saldo : parseFloat(p.saldo || "0");
      return s > 0;
    }).map(p => ({
      id: p.id,
      nombre: p.nombre,
      telefono: p.telefono || "",
      correo: p.email || "",
      saldo: typeof p.saldo === "number" ? p.saldo : parseFloat(p.saldo || "0"),
    }));

    return { success: true, pending };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al consultar pacientes" };
  }
}
