// src/lib/email.ts
export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    // Si estamos en el navegador, llamamos a nuestra ruta API
    if (typeof window !== 'undefined') {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      return await res.json();
    }
    
    // Si estamos en el servidor, usamos fetch directamente a Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[SIMULACIÓN] Correo enviado a ${to}: ${subject}`);
      return { success: true, mock: true };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acme <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    return await res.json();
  } catch (error) {
    console.error("Error en sendEmail:", error);
    return { success: false, error };
  }
}
