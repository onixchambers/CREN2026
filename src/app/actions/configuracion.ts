"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSettings(month: string) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA") {
      return { success: false, error: "Acceso denegado." };
    }

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
        email: u.email || "",
        phone: u.phone || "",
        image: u.image || "",
      })).sort((a, b) => {
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
    const session = await getServerSession(authOptions);
    const userRole = ((session?.user as any)?.role || "").toUpperCase();
    if (userRole === "TERAPEUTA" || userRole === "INVITADO") {
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

    revalidatePath("/dashboard", "layout");
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

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar perfil de usuario:", error);
    return { success: false, error: error?.message || "Error al actualizar perfil" };
  }
}
