import os
path = 'src/app/actions/configuracion.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """      users: users.map(u => ({
        id: u.id,
        usuario: u.name || "",
        rol: u.role,
        contrasena: u.password || "",
        especialidad: u.especialidad || "",
      })).sort((a, b) => {
        if (a.rol === 'Admin' && b.rol !== 'Admin') return -1;
        if (a.rol !== 'Admin' && b.rol === 'Admin') return 1;
        return 0;
      }),"""

content = content.replace('      users: users.map(u => ({\n        id: u.id,\n        usuario: u.name || "",\n        rol: u.role,\n        contrasena: u.password || "",\n        especialidad: u.especialidad || "",\n      })),', replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
