import os

path = 'src/app/actions/agenda.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''      const therapist = await prisma.user.findFirst({ where: { name: data.terapeuta, role: "THERAPIST" } });
      const therapistId = therapist ? therapist.id : (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id;'''

replacement = '''      // Buscar therapistId (sin restringir por un rol específico fijo porque puede ser "Terapeuta" o "Admin")
      const therapist = await prisma.user.findFirst({ where: { name: data.terapeuta } });
      let therapistId = therapist?.id;
      
      // Si por alguna razón no encuentra al terapeuta exacto, asignarle al admin por defecto
      if (!therapistId) {
        const admin = await prisma.user.findFirst({ where: { role: "Admin" } });
        therapistId = admin?.id;
      }'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
