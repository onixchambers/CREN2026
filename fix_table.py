import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target1 = """                <th className="px-2 py-3 border-b border-[#0e2f44]">SESIONES</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAGO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">FACT.</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SUBTOTAL</th>"""
repl1 = """                <th className="px-2 py-3 border-b border-[#0e2f44]">SESIONES</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAQUETE</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">PAGO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">FACT.</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SALDO</th>
                <th className="px-2 py-3 border-b border-[#0e2f44]">SUBTOTAL</th>"""

target2 = """                    <td className="px-2 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.estado === 'Asistio' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : a.estado.includes('Cancelo') ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-slate-100 text-slate-600'}`}>
                        {a.estado}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-500">{a.sesiones}</td>
                    <td className="px-2 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.pago === 'Sí' || a.pago !== '-' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>
                        {a.pago !== '-' ? (a.pago === 'Sí' ? 'Pagado' : a.pago) : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-500">{a.fact}</td>
                    <td className="px-2 py-3 font-medium text-[#2980b9]">{a.subtotal}</td>"""
repl2 = """                    <td className="px-2 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.estado === 'Asistio' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : a.estado.includes('Cancelo') ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-slate-100 text-slate-600'}`}>
                        {a.estado}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-500">{a.sesiones}</td>
                    <td className="px-2 py-3 text-slate-500 font-bold">{a.paqueteActual}/{a.sesiones}</td>
                    <td className="px-2 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${a.pago === 'Sí' || (a.pago !== '-' && a.pago !== '') ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>
                        {a.pago !== '-' && a.pago !== '' ? (a.pago === 'Sí' ? 'Pagado' : a.pago) : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-slate-500">{a.fact}</td>
                    <td className={`px-2 py-3 font-bold ${a.saldo != null && a.saldo < 0 ? 'text-red-500' : 'text-green-600'}`}>{a.saldo != null ? (a.saldo < 0 ? `-$${Math.abs(a.saldo).toFixed(2)}` : `$${a.saldo.toFixed(2)}`) : "$0.00"}</td>
                    <td className="px-2 py-3 font-medium text-[#2980b9]">{a.subtotal}</td>"""

if target1 in c and target2 in c:
    c = c.replace(target1, repl1)
    c = c.replace(target2, repl2)
    print("Replaced table columns")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
