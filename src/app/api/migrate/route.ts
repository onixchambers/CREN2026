import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(ALTER TABLE "User" ADD COLUMN "especialidad" TEXT;);
    return NextResponse.json({ success: true, message: 'Migration successful!' });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json({ success: true, message: 'Column already exists.' });
    }
    return NextResponse.json({ success: false, error: error.message });
  }
}
