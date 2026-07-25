import os

path = 'src/app/actions/agenda.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''      // Buscar therapistId (sin restringir por un rol específico fijo porque puede ser "Terapeuta" o "Admin")
      const therapist = await prisma.user.findFirst({ where: { name: data.terapeuta } });
      let therapistId = therapist?.id;
      
      // Si por alguna razón no encuentra al terapeuta exacto, asignarle al admin por defecto
      if (!therapistId) {
        const admin = await prisma.user.findFirst({ where: { role: "Admin" } });
        therapistId = admin?.id;
      }

      if (!therapistId) return { success: false, error: "Terapeuta no encontrado." };'''

replacement = '''      // Buscar therapistId de forma ultra-flexible (ignorar mayúsculas y espacios)
      const allUsers = await prisma.user.findMany();
      let therapistId: string | undefined = undefined;
      
      // 1. Intentar coincidencia exacta o ignorando mayúsculas
      const match = allUsers.find(u => (u.name || "").trim().toLowerCase() === (data.terapeuta || "").trim().toLowerCase());
      if (match) {
        therapistId = match.id;
      } else {
        // 2. Si no, agarrar cualquier administrador
        const admin = allUsers.find(u => (u.role || "").toUpperCase() === "ADMIN");
        if (admin) {
          therapistId = admin.id;
        } else if (allUsers.length > 0) {
          // 3. Fallback final: cualquier usuario
          therapistId = allUsers[0].id;
        }
      }

      if (!therapistId) return { success: false, error: "No hay terapeutas ni usuarios registrados en la base de datos." };'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
