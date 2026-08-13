import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function cleanPrivateKey(key: string): string {
  if (!key) return "";
  let k = key.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  k = k.replaceAll("\\n", "\n");
  k = k.replaceAll("\r\n", "\n");
  return k;
}

async function getGoogleDriveAccessTokenFromServiceAccount(clientEmail: string, privateKey: string): Promise<string> {
  const formattedKey = cleanPrivateKey(privateKey);
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const signatureInput = `${header}.${claimSet}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  const signature = signer.sign(formattedKey, "base64url");

  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "No se pudo autenticar con Google Drive (Service Account).");
  }

  return data.access_token;
}

async function getGoogleDriveAccessTokenFromOAuth(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      refresh_token: refreshToken.trim(),
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Error al renovar token de acceso de Google Drive (OAuth 2.0).");
  }

  return data.access_token;
}

export async function uploadFileToGoogleDrive(fileBuffer: Buffer, fileName: string, mimeType: string = "application/pdf", terapeutaName?: string, rowsData?: any[][]) {
  // Query raw SQL to fetch all columns from PostgreSQL table regardless of prisma compilation
  let settings: any = null;
  try {
    const rows: any[] = await prisma.$queryRaw`SELECT * FROM "SystemSettings" WHERE id = 1 LIMIT 1;`;
    if (rows && rows.length > 0) {
      settings = rows[0];
    }
  } catch (e) {
    settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  }

  if (!settings || !settings.googleDriveEnabled) {
    return { success: false, error: "Google Drive no está habilitado en Configuración." };
  }

  try {
    // 1. Check if Google Apps Script Webhook URL is configured (Instant 5TB upload without OAuth errors)
    const webhookUrl = settings.googleDriveWebhookUrl;
    if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.trim().length > 0) {
      try {
        const response = await fetch(webhookUrl.trim(), {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            fileName: fileName,
            mimeType: mimeType,
            base64: fileBuffer.toString("base64"),
            terapeutaName: terapeutaName || "",
            rows: rowsData || [],
          }),
          redirect: "follow",
        });

        const text = await response.text();
        let scriptData: any = null;
        try {
          scriptData = JSON.parse(text);
        } catch (e) {}

        if (response.status === 404 || text.includes("El archivo que solicitaste no existe") || text.includes("No se encontró la página")) {
          return {
            success: false,
            error: "La URL de Google Apps Script no encuentra el script (Error 404). Por favor asegúrate de haber pegado el código 'function doPost(e)' en el editor de Google Apps Script, guardar con Ctrl+S y crear una 'Nueva implementación' como Aplicación web con acceso 'Cualquiera'."
          };
        }

        if (text.includes("Necesitas acceso") || text.includes("<html") || text.includes("accounts.google.com") || text.includes("google.com/accounts") || response.status === 403) {
          return {
            success: false,
            error: "Permisos de Google Apps Script pendientes: En Google Apps Script, ve a Implementar > Administrar implementaciones > Editar (ícono lápiz). Asegúrate de que 'Ejecutar como' sea 'Yo', 'Quién tiene acceso' sea 'Cualquiera' (Anyone), y en 'Versión' selecciona 'Nueva versión'. Luego haz clic en Implementar y copia la URL completa con el botón 📋 Copiar."
          };
        }

        const webViewLink = scriptData?.webViewLink || scriptData?.url || scriptData?.link || scriptData?.fileUrl || "https://drive.google.com";
        if (scriptData && (scriptData.success !== false) && (scriptData.fileId || scriptData.id || scriptData.success || webViewLink !== "https://drive.google.com")) {
          return {
            success: true,
            fileId: scriptData.fileId || scriptData.id || "gdrive",
            fileName: fileName,
            webViewLink: webViewLink,
            webContentLink: webViewLink,
          };
        } else if (scriptData && scriptData.error) {
          console.warn("Apps Script Webhook returned error, using fallback:", scriptData.error);
        } else {
          console.warn("Apps Script Webhook response text:", text.slice(0, 300));
        }
      } catch (e) {
        console.warn("Apps Script Webhook fetch failed, using fallback:", e);
      }
    }

    // 2. Fallback to OAuth 2.0 Refresh Token or Service Account
    let accessToken = "";

    if (settings.googleDriveRefreshToken && settings.googleDriveClientId && settings.googleDriveClientSecret) {
      accessToken = await getGoogleDriveAccessTokenFromOAuth(
        settings.googleDriveClientId,
        settings.googleDriveClientSecret,
        settings.googleDriveRefreshToken
      );
    } else if (settings.googleDriveClientEmail && settings.googleDrivePrivateKey) {
      accessToken = await getGoogleDriveAccessTokenFromServiceAccount(
        settings.googleDriveClientEmail.trim(),
        settings.googleDrivePrivateKey
      );
    } else {
      return { success: false, error: "Faltan credenciales de Google Drive en Configuración." };
    }

    // 2. Buscar si el archivo ya existe en Google Drive para actualizarlo en lugar de duplicarlo
    let existingFileId: string | null = null;
    let existingFileUrl: string | null = null;
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and trashed=false&fields=files(id,name,webViewLink,webContentLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          existingFileId = searchData.files[0].id;
          existingFileUrl = searchData.files[0].webViewLink;
        }
      }
    } catch (e) {}

    let uploadRes;
    if (existingFileId) {
      uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": mimeType,
          },
          body: fileBuffer,
        }
      );
    } else {
      const metadata: any = {
        name: fileName,
        mimeType: mimeType,
      };

      if (settings.googleDriveFolderId && settings.googleDriveFolderId.trim().length > 0) {
        metadata.parents = [settings.googleDriveFolderId.trim()];
      }

      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody = Buffer.concat([
        Buffer.from(
          `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
        ),
        Buffer.from(`${delimiter}Content-Type: ${mimeType}\r\n\r\n`),
        fileBuffer,
        Buffer.from(closeDelimiter),
      ]);

      uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&supportsTeamDrives=true&enforceSingleParent=true&fields=id,name,webViewLink,webContentLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );
    }

    const fileData = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error(fileData.error?.message || "Error al subir archivo a Google Drive.");
    }

    // Set permission so the link is viewable
    if (fileData.id) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions?supportsAllDrives=true`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
          }),
        });
      } catch (e) {}
    }

    return {
      success: true,
      fileId: fileData.id,
      fileName: fileData.name,
      webViewLink: fileData.webViewLink,
      webContentLink: fileData.webContentLink,
    };
  } catch (error: any) {
    console.error("Error uploading to Google Drive:", error);
    return { success: false, error: error?.message || "Error al conectar con Google Drive." };
  }
}
