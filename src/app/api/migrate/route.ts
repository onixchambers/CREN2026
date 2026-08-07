import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Horario" (
        "id" TEXT NOT NULL,
        "terapeuta" TEXT NOT NULL,
        "fecha" TEXT NOT NULL,
        "horaEntrada" TEXT NOT NULL,
        "horaSalida" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
      );
    `);
    
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

    return NextResponse.json({ success: true, message: "Migrations executed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
