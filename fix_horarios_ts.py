import os

path = 'src/app/actions/horarios.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''export async function getHorariosHoy() {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const horarios = await prisma.horario.findMany({
      where: { fecha: hoy },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: horarios };
  } catch (error) {
    console.error("Error cargando horarios:", error);
    return { success: false, data: [] };
  }
}'''

replacement = '''export async function getHorariosHoy() {
  try {
    const hoy = new Date().toLocaleDateString("en-CA");
    const horarios = await prisma.horario.findMany({
      where: { fecha: hoy },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: horarios };
  } catch (error) {
    console.error("Error cargando horarios:", error);
    return { success: false, data: [] };
  }
}

export async function getHorariosByDate(fecha: string) {
  try {
    const horarios = await prisma.horario.findMany({
      where: { fecha: fecha },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: horarios };
  } catch (error) {
    console.error("Error cargando horarios:", error);
    return { success: false, data: [] };
  }
}'''

content = content.replace(target, replacement)

# Fix registrarEntrada and registrarSalida to use local date
content = content.replace('const hoy = new Date().toISOString().split("T")[0];', 'const hoy = new Date().toLocaleDateString("en-CA");')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
