"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings(month: string) {
  try {
    const [users, settings, expenses] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.systemSettings.findUnique({
        where: { id: 1 },
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
      })).sort((a, b) => {
        if (a.rol === 'Admin' && b.rol !== 'Admin') return -1;
        if (a.rol !== 'Admin' && b.rol === 'Admin') return 1;
        return 0;
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
      where: { role: "Terapeuta" },
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

        const userPromises = data.users.map((user: any) => {
          if (typeof user.id === 'string' && user.id.startsWith('c')) { 
            return prisma.user.update({
              where: { id: user.id },
              data: {
                name: user.usuario,
                role: user.rol,
                password: user.contrasena,
                especialidad: user.especialidad || "",
              }
            });
          } else { 
            return prisma.user.create({
              data: {
                name: user.usuario,
                role: user.rol,
                password: user.contrasena,
                especialidad: user.especialidad || "",
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

      revalidatePath("/dashboard", "layout");
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
    if (!userName) {
      return { success: false, error: "Usuario no identificado." };
    }

    // Special case for fallback Admin
    if (userName === "Administrador" && currentPassword === "admin123") {
      // Find or create admin user in DB to persist new password
      const adminUser = await prisma.user.findFirst({ where: { role: "Admin" } });
      if (adminUser) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { password: newPassword }
        });
      }
      return { success: true };
    }

    const user = await prisma.user.findFirst({
      where: { name: { equals: userName, mode: 'insensitive' } }
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado en el sistema." };
    }

    if (user.password !== currentPassword) {
      return { success: false, error: "La contraseña actual no es correcta." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword }
    });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error cambiando contraseña:", error);
    return { success: false, error: error?.message || "Error al actualizar contraseña" };
  }
}
