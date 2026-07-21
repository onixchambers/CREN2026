import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("Falta RESEND_API_KEY. Simulando envío en desarrollo...");
      return NextResponse.json({ success: true, mock: true, id: "mock-" + Date.now() });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acme <onboarding@resend.dev>", // Cambiar luego por dominio propio
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`Error de Resend: ${errorData}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Error enviando email:", error);
    return NextResponse.json({ error: error.message || "Error del servidor" }, { status: 500 });
  }
}
