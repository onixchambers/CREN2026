"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- PACIENTES ---
export async function getPacientes() {
  return await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createPaciente(data: { name: string; email?: string; phone?: string; notes?: string; age?: number }) {
  await prisma.patient.create({
    data,
  });
  revalidatePath("/dashboard");
}

export async function deletePaciente(id: string) {
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/dashboard");
}

// --- SESIONES ---
export async function getSesiones() {
  return await prisma.session.findMany({
    include: { patient: true, therapist: true },
    orderBy: { date: "desc" },
  });
}

export async function createSesion(data: { date: Date; patientId: string; therapistId: string; status?: string; notes?: string }) {
  await prisma.session.create({
    data,
  });
  revalidatePath("/dashboard");
}

export async function updateSesionStatus(id: string, status: string) {
  await prisma.session.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/dashboard");
}

// --- TERAPEUTAS ---
export async function getTerapeutas() {
  return await prisma.user.findMany({
    where: { role: "TERAPEUTA" },
  });
}

// --- PAGOS / FINANZAS ---
export async function getPagos() {
  return await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createPago(data: { amount: number; method: string; description?: string; type: "INGRESO" | "GASTO" }) {
  await prisma.payment.create({
    data: {
      amount: data.type === "GASTO" ? -Math.abs(data.amount) : Math.abs(data.amount),
      method: data.method,
      status: "COMPLETED",
    },
  });
  revalidatePath("/dashboard");
}
