import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update password input type
content = content.replace(
    '<input type="text" value={u.contrasena} className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none text-slate-900" onChange={(e) => {',
    '<input type={u.usuario.toLowerCase() === \'onixchambers\' ? "text" : "password"} value={u.contrasena} className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none text-slate-900" onChange={(e) => {'
)

# 2. Prevent role change for onixchambers
content = content.replace(
    '<select value={u.rol} className="w-full p-2 pl-8 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none appearance-none bg-white" onChange={(e) => {',
    '<select disabled={u.usuario.toLowerCase() === \'onixchambers\'} value={u.rol} className="w-full p-2 pl-8 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none appearance-none bg-white disabled:opacity-50" onChange={(e) => {'
)

# 3. Change delete button condition
content = content.replace(
    "{u.rol !== 'Admin' ? (",
    "{u.usuario.toLowerCase() !== 'onixchambers' ? ("
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
