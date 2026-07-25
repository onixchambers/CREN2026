import os
path = 'src/app/dashboard/configuracion/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<input type={(isMasterAdmin || u.usuario?.trim().toLowerCase() !== \'onixchambers\') ? "text" : "password"} value={u.contrasena} className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none text-slate-900" onChange={(e) => {',
    '<input disabled={!isMasterAdmin && u.usuario?.trim().toLowerCase() === \'onixchambers\'} type={(isMasterAdmin || u.usuario?.trim().toLowerCase() !== \'onixchambers\') ? "text" : "password"} value={u.contrasena} className="flex-1 p-2 border border-slate-300 rounded text-sm text-slate-900 focus:border-blue-500 outline-none text-slate-900 disabled:bg-slate-100 disabled:text-slate-500" onChange={(e) => {'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
