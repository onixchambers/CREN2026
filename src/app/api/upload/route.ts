import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibio archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo excede el limite de 10 MB" }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `cren/notas-clinicas/${timestamp}-${safeName}`;

    const blob = await put(pathname, file, { access: "public" });

    return NextResponse.json({ url: blob.url, name: file.name }, { status: 200 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    if (error.message?.includes("BLOB_READ_WRITE_TOKEN") || error.message?.includes("token")) {
      return NextResponse.json({ 
        error: "Configure BLOB_READ_WRITE_TOKEN en las variables de entorno de Vercel para habilitar el almacenamiento de fotos." 
      }, { status: 503 });
    }
    return NextResponse.json({ error: error.message || "Error al subir la imagen" }, { status: 500 });
  }
}
