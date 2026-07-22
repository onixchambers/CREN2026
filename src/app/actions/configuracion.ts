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
      })),
      settings: settings || { allowTherapistEdit: true, referenceKeys: "" },
      expenses: expenses,
    };
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return { success: false, error: error?.message || "Error desconocido" };
  }
}

export async function getTerapeutas() {
  try {
    const terapeutas = await prisma.user.findMany({
      where: { role: "Terapeuta" },
      orderBy: { name: 'asc' },
    });
    return { success: true, terapeutas: terapeutas.map(t => t.name || "") };
  } catch (error: any) {
    console.error("Error fetching terapeutas:", error);
    return { success: false, terapeutas: [] };
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
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("La conexión a la base de datos tardó demasiado (Timeout). Revisa tu DATABASE_URL en Vercel.")), 5000));
    
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

      for (const user of data.users) {
        if (typeof user.id === 'string' && user.id.startsWith('c')) { 
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: user.usuario,
              role: user.rol,
              password: user.contrasena,
            }
          });
        } else { 
          await prisma.user.create({
            data: {
              name: user.usuario,
              role: user.rol,
              password: user.contrasena,
            }
          });
        }
      }

      // 2. Save SystemSettings
      await prisma.systemSettings.upsert({
        where: { id: 1 },
        update: {
          allowTherapistEdit: data.allowTherapistEdit,
          referenceKeys: data.referenceKeys,
        },
        create: {
          id: 1,
          allowTherapistEdit: data.allowTherapistEdit,
          referenceKeys: data.referenceKeys,
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

      revalidatePath("/dashboard/configuracion");
      return { success: true };
    })();

    return await Promise.race([dbPromise, timeoutPromise]) as { success: boolean, error?: string };
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return { success: false, error: "Error de DB: " + (error?.message || String(error)) };
  }
}
