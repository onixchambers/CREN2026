import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re
target = """      const nuevaCitaObj = {
        paciente: formData.paciente,
        fecha: formData.fecha,
        hora: formData.hora,
        terapeuta: formData.terapeuta,
        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        estado: formData.estado,
        pagado: formData.pagado,
        metodoPago: formData.metodoPago
      };"""
      
repl = """      const nuevaCitaObj = {
        paciente: formData.paciente,
        fecha: formData.fecha,
        hora: formData.hora,
        terapeuta: formData.terapeuta,
        tipoServicio: formData.tipoServicio,
        frecuencia: formData.frecuencia,
        numeroSesiones: formData.numeroSesiones,
        estado: formData.estado,
        pagado: formData.pagado,
        metodoPago: formData.metodoPago
      };"""

c = c.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Added numeroSesiones to nuevaCitaObj")
