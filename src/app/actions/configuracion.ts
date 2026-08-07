"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditAction, ensureAuditTablesExist } from "@/app/actions/auditLog";

async function getSafeRole(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    return ((session?.user as any)?.role || "ADMIN").toUpperCase();
  } catch (e) {
    return "ADMIN";
  }
}

export async function getSettings(month: string) {
  try {
    const userRole = await getSafeRole();
    if (userRole === "TERAPEUTA") {
      return { success: false, error: "Acceso denegado." };
    }

    await ensureAuditTablesExist();

    let settings: any = null;
    try {
      settings = await prisma.systemSettings.findUnique({
        where: { id: 1 },
      });
    } catch (eSettings) {
      console.error("Error fetching SystemSettings, running migration retry:", eSettings);
      await ensureAuditTablesExist();
      try {
        settings = await prisma.systemSettings.findUnique({
          where: { id: 1 },
        });
      } catch (retryErr) {
        console.error("Failed SystemSettings fallback:", retryErr);
      }
    }

    const [users, expenses] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.operationalExpense.findMany({
        where: { month },
      }),
    ]);

    return {
      success: true,
      users: users.map(u => ({
        id: u.id,
        usuario: u.name || "",
        rol: u.role,
        contrasena: u.password || "",
        especialidad: u.especialidad || "",
        email: u.email || "",
        phone: u.phone || "",
        image: u.image || "",
      })).sort((a, b) => {
        const nameA = (a.usuario || "").trim().toLowerCase();
        const nameB = (b.usuario || "").trim().toLowerCase();
        if (nameA === 'onixchambers') return -1;
        if (nameB === 'onixchambers') return 1;

        const getWeight = (r: string) => {
          const role = (r || "").toLowerCase();
          if (role === 'admin') return 1;
          if (role === 'invitado') return 2;
          if (role === 'contador') return 3;
          if (role === 'terapeuta') return 4;
          return 5;
        };
        return getWeight(a.rol) - getWeight(b.rol);
      }),
      settings: settings || {
        allowTherapistEdit: true,
        referenceKeys: "",
        ivaRate: 16,
        resendApiKey: "",
        resendDays: 1,
        resendRepeatDays: 0,
        resendEnabled: false,
        whatsappApiKey: "",
        whatsappDays: 1,
        whatsappRepeatDays: 0,
        whatsappEnabled: false,
        googleDriveEnabled: false,
        googleDriveClientEmail: "",
        googleDrivePrivateKey: "",
        googleDriveFolderId: "",
        timezone: "America/Mexico_City",
        auditLogEnabled: true,
      },
      expenses: expenses,
    };
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return { success: false, error: error?.message || "Error desconocido" };
  }
}

export async function getTerapeutasFull() {
  try {
    const terapeutas = await prisma.user.findMany({
      where: {
        role: {
          equals: "Terapeuta",
          mode: "insensitive"
        }
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: terapeutas };
  } catch (error: any) {
    console.error("Error fetching terapeutas:", error);
    return { success: false, data: [] };
  }
}

export async function updateTerapeutaConfig(id: string, data: any) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
      const allow = s?.allowTherapistEdit ?? true;
      if (!allow) {
        return { success: false, error: "La administración no ha habilitado el permiso para modificar la configuración de honorarios." };
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        tipoPago: data.tipoPago,
        porcentaje: data.porcentaje,
        salarioBase: data.salarioBase,
        retieneIVA: data.retieneIVA,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating terapeuta config:", error);
    return { success: false, error: error?.message || "Error desconocido" };
  }
}

export async function getTerapeutas() {
  try {
    const terapeutas = await prisma.user.findMany({
      where: { role: "Terapeuta" },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: terapeutas, terapeutas: terapeutas.map(t => t.name || "") };
  } catch (error: any) {
    console.error("Error fetching terapeutas:", error);
    return { success: false, data: [], terapeutas: [] };
  }
}

export async function saveSettings(data: {
  users: any[];
  allowTherapistEdit: boolean;
  referenceKeys: string;
  month: string;
  expenses: { label: string; amount: number }[];
}) {
  try {
    const userRole = await getSafeRole();
    if (userRole === "TERAPEUTA") {
      return { success: false, error: "No tienes permisos para modificar la configuración." };
    }

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("La conexión a la base de datos tardó demasiado (Timeout). Revisa tu DATABASE_URL en Vercel.")), 15000));
    
    const dbPromise = (async () => {
      // 1. Process Users
      const existingUsers = await prisma.user.findMany();
      const existingUserIds = existingUsers.map(u => u.id);
      const incomingUserIds = data.users.filter(u => typeof u.id === 'string' && u.id.startsWith('c')).map(u => u.id);
      
      const usersToDelete = existingUserIds.filter(id => !incomingUserIds.includes(id));
      if (usersToDelete.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: usersToDelete } }
        });
      }

        const userPromises = data.users.map(async (user: any) => {
          let finalPassword = user.contrasena || "";
          if (finalPassword && !finalPassword.startsWith("$2b$") && !finalPassword.startsWith("$2a$")) {
            finalPassword = await bcrypt.hash(finalPassword, 10);
          }

          if (typeof user.id === 'string' && user.id.startsWith('c')) { 
            return prisma.user.update({
              where: { id: user.id },
              data: {
                name: user.usuario,
                role: user.rol,
                password: finalPassword,
                especialidad: user.especialidad || "",
                email: user.email || null,
                phone: user.phone || null,
                image: user.image || null,
              }
            });
          } else { 
            return prisma.user.create({
              data: {
                name: user.usuario,
                role: user.rol,
                password: finalPassword,
                especialidad: user.especialidad || "",
                email: user.email || null,
                phone: user.phone || null,
                image: user.image || null,
              }
            });
          }
        });
        await Promise.all(userPromises);

      // 2. Save SystemSettings
      await prisma.systemSettings.upsert({
        where: { id: 1 },
        update: {
          allowTherapistEdit: data.allowTherapistEdit,
          referenceKeys: data.referenceKeys,
          ivaRate: (data as any).ivaRate !== undefined ? parseFloat((data as any).ivaRate) : 16,
          resendApiKey: (data as any).resendApiKey || "",
          resendDays: parseInt((data as any).resendDays || 1),
          resendRepeatDays: parseInt((data as any).resendRepeatDays || 0),
          resendEnabled: Boolean((data as any).resendEnabled),
          whatsappApiKey: (data as any).whatsappApiKey || "",
          whatsappDays: parseInt((data as any).whatsappDays || 1),
          whatsappRepeatDays: parseInt((data as any).whatsappRepeatDays || 0),
          whatsappEnabled: Boolean((data as any).whatsappEnabled),
          googleDriveEnabled: Boolean((data as any).googleDriveEnabled),
          googleDriveClientEmail: (data as any).googleDriveClientEmail || "",
          googleDrivePrivateKey: (data as any).googleDrivePrivateKey || "",
          googleDriveFolderId: (data as any).googleDriveFolderId || "",
          timezone: (data as any).timezone || "America/Mexico_City",
          auditLogEnabled: (data as any).auditLogEnabled !== undefined ? Boolean((data as any).auditLogEnabled) : true,
        },
        create: {
          id: 1,
          allowTherapistEdit: data.allowTherapistEdit,
          referenceKeys: data.referenceKeys,
          ivaRate: (data as any).ivaRate !== undefined ? parseFloat((data as any).ivaRate) : 16,
          resendApiKey: (data as any).resendApiKey || "",
          resendDays: parseInt((data as any).resendDays || 1),
          resendRepeatDays: parseInt((data as any).resendRepeatDays || 0),
          resendEnabled: Boolean((data as any).resendEnabled),
          whatsappApiKey: (data as any).whatsappApiKey || "",
          whatsappDays: parseInt((data as any).whatsappDays || 1),
          whatsappRepeatDays: parseInt((data as any).whatsappRepeatDays || 0),
          whatsappEnabled: Boolean((data as any).whatsappEnabled),
          googleDriveEnabled: Boolean((data as any).googleDriveEnabled),
          googleDriveClientEmail: (data as any).googleDriveClientEmail || "",
          googleDrivePrivateKey: (data as any).googleDrivePrivateKey || "",
          googleDriveFolderId: (data as any).googleDriveFolderId || "",
          timezone: (data as any).timezone || "America/Mexico_City",
          auditLogEnabled: (data as any).auditLogEnabled !== undefined ? Boolean((data as any).auditLogEnabled) : true,
        }
      });

      // 3. Save Expenses
      const incomingExpenseLabels = data.expenses.map(e => e.label);
      await prisma.operationalExpense.deleteMany({
        where: {
          month: data.month,
          label: { notIn: incomingExpenseLabels }
        }
      });

      for (const exp of data.expenses) {
        if (!exp.label.trim()) continue; 
        await prisma.operationalExpense.upsert({
          where: {
            month_label: {
              month: data.month,
              label: exp.label,
            }
          },
          update: { amount: exp.amount },
          create: { month: data.month, label: exp.label, amount: exp.amount }
        });
      }

      try { revalidatePath("/dashboard/configuracion"); } catch (e) {}
      return { success: true };
    })();

    return await Promise.race([dbPromise, timeoutPromise]) as { success: boolean, error?: string };
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return { success: false, error: "Error de DB: " + (error?.message || String(error)) };
  }
}

export async function getSystemIvaRate() {
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    return s?.ivaRate !== undefined && s?.ivaRate !== null ? s.ivaRate : 16;
  } catch (e) {
    return 16;
  }
}

export async function changeUserPassword(userName: string, currentPassword: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    const sessionName = session?.user?.name || "";
    const sessionEmail = session?.user?.email || "";
    const sessionRole = ((session?.user as any)?.role || "").toUpperCase();

    // Buscar el usuario en base a nombre de sesión, nombre recibido o email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userName ? [{ name: { equals: userName, mode: 'insensitive' as const } }] : []),
          ...(sessionName ? [{ name: { equals: sessionName, mode: 'insensitive' as const } }] : []),
          ...(sessionEmail ? [{ email: { equals: sessionEmail, mode: 'insensitive' as const } }] : []),
        ]
      }
    });

    // Búsqueda de respaldo si el rol es Administrador
    if (!user && (sessionRole === "ADMIN" || sessionRole === "ADMINISTRADOR")) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { role: { equals: "Admin", mode: 'insensitive' as const } },
            { role: { equals: "ADMINISTRADOR", mode: 'insensitive' as const } }
          ]
        }
      });
    }

    if (!user || !user.password) {
      return { success: false, error: "Usuario no encontrado en el sistema." };
    }

    let isMatch = false;
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
      isMatch = user.password === currentPassword;
    }

    if (!isMatch) {
      return { success: false, error: "La contraseña actual no es correcta." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    try { revalidatePath("/dashboard/configuracion"); } catch (e) {}
    return { success: true };
  } catch (error: any) {
    console.error("Error cambiando contraseña:", error);
    return { success: false, error: error?.message || "Error al actualizar contraseña" };
  }
}

export async function getAllowTherapistEdit() {
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    return s?.allowTherapistEdit ?? true;
  } catch (e) {
    return true;
  }
}

export async function getSystemTimezone() {
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    return s?.timezone || "America/Mexico_City";
  } catch (e) {
    return "America/Mexico_City";
  }
}

export async function getCurrentUserProfile() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) return { success: false };

    const dbUser = await prisma.user.findFirst({
      where: { name: { equals: session.user.name, mode: "insensitive" } },
      select: { email: true, image: true, phone: true, role: true, name: true }
    });

    if (dbUser) {
      return {
        success: true,
        user: {
          name: dbUser.name,
          email: dbUser.email || session.user.email || "",
          image: dbUser.image || "",
          phone: dbUser.phone || "",
          role: dbUser.role || (session.user as any).role
        }
      };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

export async function updateOwnUserProfile(data: { email?: string; phone?: string; image?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
      return { success: false, error: "No autenticado" };
    }

    const cleanName = session.user.name.trim();
    const user = await prisma.user.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } }
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: data.email !== undefined ? data.email : user.email,
        phone: data.phone !== undefined ? data.phone : user.phone,
        image: data.image !== undefined ? data.image : user.image,
      }
    });

    revalidatePath("/dashboard/configuracion");
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar perfil de usuario:", error);
    return { success: false, error: error?.message || "Error al actualizar perfil" };
  }
}

export async function getTherapyPrices() {
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const raw = (s as any)?.therapyPrices;
    if (raw && typeof raw === "string" && raw.trim()) {
      const parsed = raw.split(",").map(p => parseFloat(p.trim())).filter(p => !isNaN(p) && p > 0);
      if (parsed.length > 0) {
        return { success: true, prices: Array.from(new Set(parsed)).sort((a, b) => a - b) };
      }
    }
    const defaultPrices = [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950];
    return { success: true, prices: defaultPrices };
  } catch (e) {
    return { success: true, prices: [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950] };
  }
}

export async function addTherapyPrice(price: number) {
  try {
    const userRole = await getSafeRole();
    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "INVITADO") {
      return { success: false, error: "Únicamente el usuario con rol Administrador o Invitado puede agregar o modificar precios de terapia." };
    }

    if (!price || isNaN(price) || price <= 0) {
      return { success: false, error: "El precio debe ser un número mayor a 0." };
    }

    const currentRes = await getTherapyPrices();
    let currentPrices = currentRes.prices || [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950];
    if (!currentPrices.includes(price)) {
      currentPrices.push(price);
      currentPrices.sort((a, b) => a - b);
    }

    const joinedStr = currentPrices.join(",");
    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { therapyPrices: joinedStr } as any,
      create: { id: 1, therapyPrices: joinedStr } as any,
    });

    try { revalidatePath("/dashboard/configuracion"); } catch (e) {}
    
    await logAuditAction({
      action: "AGREGAR_PRECIO_TERAPIA",
      details: `Se agregó el nuevo precio de terapia $${price}.`,
      target: `$${price}`
    });

    return { success: true, prices: currentPrices };
  } catch (error: any) {
    console.error("Error adding therapy price:", error);
    return { success: false, error: error?.message || "Error al agregar precio de terapia." };
  }
}

export async function removeTherapyPrice(price: number) {
  try {
    const userRole = await getSafeRole();
    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "INVITADO") {
      return { success: false, error: "Únicamente el usuario con rol Administrador o Invitado puede eliminar precios de terapia." };
    }

    const currentRes = await getTherapyPrices();
    let currentPrices = (currentRes.prices || []).filter(p => p !== price);
    if (currentPrices.length === 0) {
      currentPrices = [500];
    }
    currentPrices.sort((a, b) => a - b);

    const joinedStr = currentPrices.join(",");
    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { therapyPrices: joinedStr } as any,
      create: { id: 1, therapyPrices: joinedStr } as any,
    });

    try { revalidatePath("/dashboard/configuracion"); } catch (e) {}

    await logAuditAction({
      action: "ELIMINAR_PRECIO_TERAPIA",
      details: `Se eliminó el precio de terapia $${price}.`,
      target: `$${price}`
    });

    return { success: true, prices: currentPrices };
  } catch (error: any) {
    console.error("Error removing therapy price:", error);
    return { success: false, error: error?.message || "Error al eliminar precio de terapia." };
  }
}

export async function getTherapistsList() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" }
    });
    const therapists = users
      .filter(u => (u.role || "").toUpperCase() === "TERAPEUTA")
      .map(u => u.name)
      .filter(Boolean) as string[];
    return { success: true, therapists };
  } catch (error: any) {
    console.error("Error fetching therapists list:", error);
    return { success: false, therapists: [] };
  }
}

export async function getTherapistBroadcastMessage() {
  noStore();
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!s || !s.referenceKeys) return { success: true, broadcast: null };

    try {
      const parsed = JSON.parse(s.referenceKeys);
      if (parsed.therapistBroadcast) {
        return { success: true, broadcast: parsed.therapistBroadcast };
      }
    } catch (e) {}

    return { success: true, broadcast: null };
  } catch (error: any) {
    console.error("Error fetching therapist broadcast:", error);
    return { success: false, error: error?.message };
  }
}

export async function saveTherapistBroadcastMessage(title: string, message: string, targets: string[] = ["TODOS"]) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    const senderName = session?.user?.name || (userRole === "INVITADO" ? "Invitado" : "Administrador");

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "INVITADO") {
      return { success: false, error: "Únicamente el usuario con rol Administrador o Invitado puede enviar mensajes a los terapeutas." };
    }

    if (!title || !title.trim() || !message || !message.trim()) {
      return { success: false, error: "El título y el mensaje son obligatorios." };
    }

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    let settingsObj: any = {};
    if (s && s.referenceKeys) {
      try { settingsObj = JSON.parse(s.referenceKeys); } catch (e) {}
    }

    const previousBroadcast = settingsObj.therapistBroadcast;
    const isSameMessage = previousBroadcast && previousBroadcast.title === title.trim() && previousBroadcast.message === message.trim();
    const existingReadBy = isSameMessage && Array.isArray(previousBroadcast.readBy) ? previousBroadcast.readBy : [];

    const broadcastPayload = {
      id: isSameMessage ? previousBroadcast.id : "bcast_" + Date.now(),
      title: title.trim(),
      message: message.trim(),
      sender: senderName,
      targets: Array.isArray(targets) && targets.length > 0 ? targets : ["TODOS"],
      date: new Date().toISOString(),
      active: true,
      readBy: existingReadBy,
    };

    settingsObj.therapistBroadcast = broadcastPayload;
    const jsonString = JSON.stringify(settingsObj);

    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { referenceKeys: jsonString },
      create: { id: 1, referenceKeys: jsonString },
    });

    try { revalidatePath("/dashboard/configuracion"); } catch (e) {}
    return { success: true, broadcast: broadcastPayload };
  } catch (error: any) {
    console.error("Error saving therapist broadcast:", error);
    return { success: false, error: error?.message || "Error al enviar mensaje a terapeutas." };
  }
}

export async function clearTherapistBroadcastMessage() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "ADMINISTRADOR" && userRole !== "INVITADO") {
      return { success: false, error: "Permiso denegado." };
    }

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    let settingsObj: any = {};
    if (s && s.referenceKeys) {
      try { settingsObj = JSON.parse(s.referenceKeys); } catch (e) {}
    }

    if (settingsObj.therapistBroadcast) {
      settingsObj.therapistBroadcast.active = false;
    }

    const jsonString = JSON.stringify(settingsObj);
    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { referenceKeys: jsonString },
      create: { id: 1, referenceKeys: jsonString },
    });

    try { revalidatePath("/dashboard/configuracion"); } catch (e) {}
    return { success: true };
  } catch (error: any) {
    console.error("Error clearing therapist broadcast:", error);
    return { success: false, error: error?.message };
  }
}

export async function markTherapistBroadcastAsRead(broadcastId: string, customName?: string) {
  try {
    const session = await getServerSession(authOptions);
    let userName = (customName || session?.user?.name || "").trim();

    if (!userName || userName.toLowerCase() === "administrador" || userName.toLowerCase() === "terapeuta") {
      const userId = (session?.user as any)?.id;
      if (userId) {
        const u = await prisma.user.findUnique({ where: { id: userId } });
        if (u && u.name) userName = u.name.trim();
      }
    }

    if (!userName) userName = "Terapeuta";

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!s || !s.referenceKeys) return { success: false };

    let settingsObj: any = {};
    try { settingsObj = JSON.parse(s.referenceKeys); } catch (e) {}

    const bcast = settingsObj.therapistBroadcast;
    if (bcast && bcast.id === broadcastId) {
      if (!Array.isArray(bcast.readBy)) {
        bcast.readBy = [];
      }
      const alreadyRead = bcast.readBy.some((r: any) => r.name?.toLowerCase().trim() === userName.toLowerCase().trim());
      if (!alreadyRead) {
        bcast.readBy.push({
          name: userName,
          readAt: new Date().toISOString()
        });
        settingsObj.therapistBroadcast = bcast;
        await prisma.systemSettings.update({
          where: { id: 1 },
          data: { referenceKeys: JSON.stringify(settingsObj) }
        });
      }
    }

    try { revalidatePath("/dashboard/configuracion"); } catch (e) {}
    return { success: true, readBy: bcast?.readBy || [] };
  } catch (error: any) {
    console.error("Error marking broadcast read:", error);
    return { success: false, error: error?.message };
  }
}


