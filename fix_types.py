import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target1 = """  subtotal: string;
  total: string;
  obs: string;"""
repl1 = """  subtotal: string;
  total: string;
  saldo?: number;
  precioTerapia?: string;
  montoPago?: string;
  paqueteActual?: number;
  obs: string;"""

target2 = """      subtotal: `$${sub.toFixed(2)}`,
      total: `$${tot.toFixed(2)}`,
      obs: formData.observaciones || "—","""
repl2 = """      subtotal: `$${sub.toFixed(2)}`,
      total: `$${tot.toFixed(2)}`,
      precioTerapia: formData.precioTerapia,
      montoPago: formData.montoPago,
      obs: formData.observaciones || "—","""

if target1 in c and target2 in c:
    c = c.replace(target1, repl1)
    c = c.replace(target2, repl2)
    print("Added properties to Asistencia type and nuevaAsistencia")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
