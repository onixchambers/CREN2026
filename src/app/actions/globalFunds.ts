"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getSafeRoleAndUser(): Promise<{ role: string; name: string }> {
  try {
    const session = await getServerSession(authOptions);
    return {
      role: ((session?.user as any)?.role || "ADMIN").toUpperCase(),
      name: (session?.user as any)?.name || "Sistema"
    };
  } catch (e) {
    return { role: "ADMIN", name: "Sistema" };
  }
}

export async function getGlobalFunds() {
  noStore();
  try {
    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!s || !s.referenceKeys) return { success: true, funds: [] };

    let rawFunds: any[] = [];
    try {
      const parsed = JSON.parse(s.referenceKeys);
      rawFunds = parsed.globalFunds || [];
    } catch (e) {
      return { success: true, funds: [] };
    }

    if (rawFunds.length === 0) return { success: true, funds: [] };

    // Gather all linked patient IDs
    const allLinkedPatientIds: string[] = [];
    rawFunds.forEach((f: any) => {
      if (Array.isArray(f.patientIds)) {
        f.patientIds.forEach((pid: string) => {
          if (pid && !allLinkedPatientIds.includes(pid)) allLinkedPatientIds.push(pid);
        });
      }
    });

    // Query sessions for linked patients to calculate therapy consumptions
    let patientSessions: any[] = [];
    if (allLinkedPatientIds.length > 0) {
      patientSessions = await prisma.session.findMany({
        where: {
          patientId: { in: allLinkedPatientIds }
        },
        include: {
          patient: { select: { id: true, name: true, precioTerapia: true } },
          therapist: { select: { id: true, name: true } }
        },
        orderBy: { date: 'asc' }
      });
    }

    const funds = rawFunds.map((fund: any) => {
      const linkedIds = fund.patientIds || [];
      const totalAbonado = (fund.payments || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      const fundSessions = patientSessions.filter(s => linkedIds.includes(s.patientId));
      const usages: any[] = [];
      let totalConsumido = 0;

      fundSessions.forEach(s => {
        let extra: any = {};
        if (s.notes) {
          try {
            extra = JSON.parse(s.notes);
          } catch (e) {}
        }

        const estNorm = (extra.estadoAsistencia || extra.estado || s.status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isAgendado = estNorm.includes("agendado");
        const isFreeCancel = !isAgendado && (estNorm.includes("con anticip") || estNorm.includes("anticipad") || estNorm.includes("centro") || estNorm.includes("recuperado")) && !estNorm.includes("sin anticip");

        if (!isAgendado && !isFreeCancel) {
          const parseMoneyStr = (val: any) => parseFloat((val || "0").toString().replace(/[^0-9.-]/g, "")) || 0;
          const defaultPrice = parseFloat((s.patient?.precioTerapia || "500").split("/")[0]) || 500;
          const hasCosto = (extra.costoSesion !== undefined && extra.costoSesion !== null && String(extra.costoSesion).trim() !== "") ||
                           (extra.precioTerapia !== undefined && extra.precioTerapia !== null && String(extra.precioTerapia).trim() !== "");
          const costoS = hasCosto ? parseMoneyStr(extra.costoSesion || extra.precioTerapia) : defaultPrice;
          
          const p1 = parseMoneyStr(extra.montoPago);
          const p2 = parseMoneyStr(extra.montoPago2);
          const directPay = p1 + p2;

          const sDate = extra.fecha || (s.date instanceof Date ? s.date.toISOString().split("T")[0] : String(s.date).split("T")[0]);
          const isBeforeCutoff = sDate && sDate <= "2026-06-30";

          if (!isBeforeCutoff) {
            const netConsumption = costoS - directPay;
            if (netConsumption > 0) {
              totalConsumido += netConsumption;
              usages.push({
                id: s.id,
                date: sDate,
                hora: extra.hora || extra.horaRegistro || "09:00",
                patientId: s.patientId,
                patientName: s.patient?.name || extra.pacienteNombre || "Paciente",
                therapistName: s.therapist?.name || extra.terapeutaNombre || "Terapeuta",
                area: extra.area || s.area || "Terapia",
                cost: netConsumption,
                estado: extra.estadoAsistencia || "Asistió"
              });
            }
          }
        }
      });

      const saldoDisponible = totalAbonado - totalConsumido;

      return {
        ...fund,
        totalAbonado,
        totalConsumido,
        saldoDisponible,
        usages
      };
    });

    return { success: true, funds };
  } catch (error: any) {
    console.error("Error fetching global funds:", error);
    return { success: false, error: error?.message || "Error al obtener fondos globales" };
  }
}

export async function saveGlobalFund(payload: { id?: string; name: string; patientIds: string[] }) {
  try {
    const { role } = await getSafeRoleAndUser();
    if (role === "TERAPEUTA") {
      return { success: false, error: "Permiso denegado. Solo administradores o invitados pueden modificar fondos globales." };
    }

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    let settingsObj: any = {};
    if (s && s.referenceKeys) {
      try {
        settingsObj = JSON.parse(s.referenceKeys);
      } catch (e) {}
    }

    if (!settingsObj.globalFunds) {
      settingsObj.globalFunds = [];
    }

    const fundsList = settingsObj.globalFunds;

    if (payload.id) {
      // Update existing
      const idx = fundsList.findIndex((f: any) => f.id === payload.id);
      if (idx !== -1) {
        fundsList[idx] = {
          ...fundsList[idx],
          name: payload.name,
          patientIds: payload.patientIds
        };
      } else {
        return { success: false, error: "No se encontró el fondo familiar a actualizar." };
      }
    } else {
      // Create new
      const newFund = {
        id: `fund-${Date.now()}`,
        name: payload.name,
        patientIds: payload.patientIds,
        payments: []
      };
      fundsList.push(newFund);
    }

    const jsonString = JSON.stringify(settingsObj);

    await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { referenceKeys: jsonString },
      create: { id: 1, referenceKeys: jsonString },
    });

    revalidatePath("/dashboard/honorarios");
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/asistencia");

    return { success: true };
  } catch (error: any) {
    console.error("Error saving global fund:", error);
    return { success: false, error: error?.message || "Error al guardar el fondo familiar." };
  }
}

export async function deleteGlobalFund(id: string) {
  try {
    const { role } = await getSafeRoleAndUser();
    if (role === "TERAPEUTA") {
      return { success: false, error: "Permiso denegado. Solo administradores o invitados pueden eliminar fondos globales." };
    }

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!s || !s.referenceKeys) return { success: false, error: "No hay configuraciones registradas." };

    let settingsObj: any = {};
    try {
      settingsObj = JSON.parse(s.referenceKeys);
    } catch (e) {}

    if (settingsObj.globalFunds) {
      settingsObj.globalFunds = settingsObj.globalFunds.filter((f: any) => f.id !== id);
    }

    const jsonString = JSON.stringify(settingsObj);

    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { referenceKeys: jsonString }
    });

    revalidatePath("/dashboard/honorarios");
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/asistencia");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting global fund:", error);
    return { success: false, error: error?.message || "Error al eliminar el fondo familiar." };
  }
}

export async function addPaymentToFund(
  fundId: string,
  payment: { amount: number; date: string; method: string; notes?: string }
) {
  try {
    const { role, name: userName } = await getSafeRoleAndUser();
    if (role === "TERAPEUTA") {
      return { success: false, error: "Permiso denegado. Solo administradores o invitados pueden registrar abonos al fondo global." };
    }

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!s || !s.referenceKeys) return { success: false, error: "No hay configuraciones registradas." };

    let settingsObj: any = {};
    try {
      settingsObj = JSON.parse(s.referenceKeys);
    } catch (e) {}

    const fundsList = settingsObj.globalFunds || [];
    const fund = fundsList.find((f: any) => f.id === fundId);

    if (!fund) {
      return { success: false, error: "Fondo familiar no encontrado." };
    }

    if (!fund.payments) {
      fund.payments = [];
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      amount: payment.amount,
      date: payment.date || new Date().toISOString().split("T")[0],
      method: payment.method || "Transferencia",
      notes: payment.notes || "",
      registeredBy: userName,
      createdAt: new Date().toISOString()
    };

    fund.payments.push(newPayment);

    const jsonString = JSON.stringify(settingsObj);

    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { referenceKeys: jsonString }
    });

    revalidatePath("/dashboard/honorarios");
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/asistencia");

    return { success: true };
  } catch (error: any) {
    console.error("Error adding payment to global fund:", error);
    return { success: false, error: error?.message || "Error al registrar el abono." };
  }
}

export async function deletePaymentFromFund(fundId: string, paymentId: string) {
  try {
    const { role } = await getSafeRoleAndUser();
    if (role === "TERAPEUTA") {
      return { success: false, error: "Permiso denegado. Solo administradores o invitados pueden eliminar abonos." };
    }

    const s = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!s || !s.referenceKeys) return { success: false, error: "No hay configuraciones registradas." };

    let settingsObj: any = {};
    try {
      settingsObj = JSON.parse(s.referenceKeys);
    } catch (e) {}

    const fundsList = settingsObj.globalFunds || [];
    const fund = fundsList.find((f: any) => f.id === fundId);

    if (!fund) {
      return { success: false, error: "Fondo familiar no encontrado." };
    }

    if (fund.payments) {
      fund.payments = fund.payments.filter((p: any) => p.id !== paymentId);
    }

    const jsonString = JSON.stringify(settingsObj);

    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { referenceKeys: jsonString }
    });

    revalidatePath("/dashboard/honorarios");
    revalidatePath("/dashboard/pacientes");
    revalidatePath("/dashboard/asistencia");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting payment from global fund:", error);
    return { success: false, error: error?.message || "Error al eliminar el abono." };
  }
}
