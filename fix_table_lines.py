import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i in range(len(lines)):
    if 'border-[#0e2f44]">SESIONES</th>' in lines[i]:
        # found the header row for SESIONES
        if 'PAQUETE' not in lines[i+1]:
            lines.insert(i+1, '                <th className="px-2 py-3 border-b border-[#0e2f44]">PAQUETE</th>')
            print("Added PAQUETE header")

for i in range(len(lines)):
    if 'border-[#0e2f44]">FACT.</th>' in lines[i]:
        # found FACT
        if 'SALDO' not in lines[i+1]:
            lines.insert(i+1, '                <th className="px-2 py-3 border-b border-[#0e2f44]">SALDO</th>')
            print("Added SALDO header")

for i in range(len(lines)):
    if 'a.sesiones}</td>' in lines[i]:
        # found sesiones td
        if 'a.paqueteActual' not in lines[i+1]:
            lines.insert(i+1, '                  <td className="px-2 py-3 text-slate-500 font-bold">{a.paqueteActual}/{a.sesiones}</td>')
            print("Added PAQUETE td")

for i in range(len(lines)):
    if 'a.fact}</td>' in lines[i]:
        # found fact td
        if 'a.saldo' not in lines[i+1]:
            lines.insert(i+1, '                  <td className={`px-2 py-3 font-bold ${a.saldo != null && a.saldo < 0 ? "text-red-500" : "text-green-600"}`}>{a.saldo != null ? (a.saldo < 0 ? `-$${Math.abs(a.saldo).toFixed(2)}` : `$${a.saldo.toFixed(2)}`) : "$0.00"}</td>')
            print("Added SALDO td")

with open(path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
