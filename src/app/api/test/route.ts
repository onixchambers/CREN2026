import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  await prisma.session.update({ where: { id: 'cmsfa10xr000104l7zs3345jy' }, data: { notes: JSON.stringify({'asistenciaGuardada':true,'paqueteActual':1,'saldo':0,'montoPago':'850','costoSesion':'850','fecha':'2026-08-04','hora':'09:00','area':'Lenguaje','tipoSesion':'Valoracion','estadoAsistencia':'Asistio','estado':'Asistio','sesiones':'1','metodoPago':'Efectivo ','solicitaFactura':false,'subtotal':850,'total':850,'obs':'','creadoPor':'lulu','pagado':true,'frecuencia':'Semanal','horaRegistro':'16:00'}) } });
  return NextResponse.json({ ok: true });
}
