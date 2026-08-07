"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

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
    const settings = await prisma.systemSettings.findFirst();
    return settings?.auditLogEnabled ?? true;
  } catch (e) {
    return true;
  }
}

export async function toggleAuditLogEnabled(enabled: boolean) {
  try {
    await ensureAuditTablesExist();
    const session = await getServerSession(authOptions);
    const userRole = (session?.user?.role || "").toUpperCase();
    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR") {
      return { success: false, error: "Solo los administradores pueden cambiar esta configuración." };
    }

    const settings = await prisma.systemSettings.findFirst();
    if (settings) {
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { auditLogEnabled: enabled }
      });
    } else {
      await prisma.systemSettings.create({
        data: { auditLogEnabled: enabled }
      });
    }

    await logAuditActionInternal({
      userName: session?.user?.name || "Administrador",
      userRole: session?.user?.role || "ADMIN",
      userEmail: session?.user?.email || null,
      action: "CONFIGURACION_AUDITORIA",
      details: enabled ? "Se activó el registro de auditoría de modificaciones." : "Se desactivó el registro de auditoría de modificaciones.",
      target: "Sistema de Auditoría"
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true, enabled };
  } catch (error) {
    console.error("Error al cambiar estado de auditoría:", error);
    return { success: false, error: "Error al actualizar la configuración de auditoría." };
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

    const session = await getServerSession(authOptions);
    if (!session?.user) return;

    const roleUpper = (session.user.role || "").toUpperCase();
    const isTargetRole = ["ADMIN", "ADMINISTRADOR", "INVITADO"].includes(roleUpper);
    
    if (!isTargetRole) return;

    await prisma.auditLog.create({
      data: {
        userName: session.user.name || "Usuario",
        userRole: session.user.role || "USER",
        userEmail: session.user.email || null,
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
    const session = await getServerSession(authOptions);
    const roleUpper = (session?.user?.role || "").toUpperCase();

    if (roleUpper !== "ADMIN" && roleUpper !== "ADMINISTRADOR") {
      return { success: false, error: "No autorizado. Solo los administradores pueden ver el registro de modificaciones." };
    }

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
  } catch (error) {
    console.error("Error obteniendo registros de auditoría:", error);
    return { success: false, error: "Error al cargar los registros de auditoría." };
  }
}

export async function clearAuditLogs() {
  try {
    const session = await getServerSession(authOptions);
    const roleUpper = (session?.user?.role || "").toUpperCase();

    if (roleUpper !== "ADMIN" && roleUpper !== "ADMINISTRADOR") {
      return { success: false, error: "No autorizado para borrar el historial de auditoría." };
    }

    await prisma.auditLog.deleteMany({});
    
    await logAuditActionInternal({
      userName: session?.user?.name || "Administrador",
      userRole: session?.user?.role || "ADMIN",
      userEmail: session?.user?.email || null,
      action: "LIMPIAR_AUDITORIA",
      details: "Se vació el historial completo de modificaciones del sistema.",
      target: "Historial de Auditoría"
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error borrando auditoría:", error);
    return { success: false, error: "Error al borrar el historial de auditoría." };
  }
}
