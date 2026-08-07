"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";

let autoMigrated = false;

export async function ensureAuditTablesExist() {
  if (autoMigrated) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "auditLogEnabled" BOOLEAN NOT NULL DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL,
        "userName" TEXT NOT NULL,
        "userRole" TEXT NOT NULL,
        "userEmail" TEXT,
        "action" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "target" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);
    autoMigrated = true;
  } catch (e) {
    console.error("Auto-migration AuditLog error:", e);
  }
}

export async function isAuditLogEnabled(): Promise<boolean> {
  await ensureAuditTablesExist();
  try {
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 1 },
      select: { auditLogEnabled: true }
    });
    return settings?.auditLogEnabled ?? true;
  } catch (e) {
    return true;
  }
}

export async function toggleAuditLogEnabled(enabled: boolean) {
  try {
    await ensureAuditTablesExist();
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {}

    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { auditLogEnabled: enabled },
      create: { id: 1, auditLogEnabled: enabled }
    });

    await logAuditActionInternal({
      userName: session?.user?.name || "Administrador",
      userRole: session?.user?.role || "ADMIN",
      userEmail: session?.user?.email || null,
      action: "CONFIGURACION_AUDITORIA",
      details: enabled ? "Se activó el registro de auditoría de modificaciones." : "Se desactivó el registro de auditoría de modificaciones.",
      target: "Sistema de Auditoría"
    });

    return { success: true, enabled };
  } catch (error: any) {
    console.error("Error al cambiar estado de auditoría:", error);
    return { success: false, error: error?.message || "Error al actualizar la configuración de auditoría." };
  }
}

async function logAuditActionInternal(params: {
  userName: string;
  userRole: string;
  userEmail?: string | null;
  action: string;
  details: string;
  target?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userName: params.userName,
        userRole: params.userRole,
        userEmail: params.userEmail || null,
        action: params.action,
        details: params.details,
        target: params.target || null
      }
    });
  } catch (err) {
    console.error("Error registrando auditoría interna:", err);
  }
}

export async function logAuditAction(params: {
  action: string;
  details: string;
  target?: string | null;
}) {
  try {
    const enabled = await isAuditLogEnabled();
    if (!enabled) return;

    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {}

    const roleUpper = (session?.user?.role || "ADMIN").toUpperCase();
    const isTargetRole = ["ADMIN", "ADMINISTRADOR", "INVITADO"].includes(roleUpper);
    
    if (!isTargetRole) return;

    await prisma.auditLog.create({
      data: {
        userName: session?.user?.name || "Usuario Admin",
        userRole: session?.user?.role || "ADMIN",
        userEmail: session?.user?.email || null,
        action: params.action,
        details: params.details,
        target: params.target || null
      }
    });
  } catch (error) {
    console.error("Error registrando acción de auditoría:", error);
  }
}

export async function getAuditLogs() {
  noStore();
  try {
    await ensureAuditTablesExist();
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {}

    const enabled = await isAuditLogEnabled();
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return {
      success: true,
      enabled,
      logs: logs.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    console.error("Error obteniendo registros de auditoría:", error);
    return { success: true, enabled: true, logs: [] };
  }
}

export async function clearAuditLogs() {
  try {
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {}

    await prisma.auditLog.deleteMany({});
    
    await logAuditActionInternal({
      userName: session?.user?.name || "Administrador",
      userRole: session?.user?.role || "ADMIN",
      userEmail: session?.user?.email || null,
      action: "LIMPIAR_AUDITORIA",
      details: "Se vació el historial completo de modificaciones del sistema.",
      target: "Historial de Auditoría"
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error borrando auditoría:", error);
    return { success: false, error: error?.message || "Error al borrar el historial de auditoría." };
  }
}
