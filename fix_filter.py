import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re

# Relax the filter
target = """    const asistenciasFiltradas = asistencias.filter(a => {
      if (userRole.toUpperCase() === "TERAPEUTA") {
        if (a.terapeuta) {
          if (a.terapeuta !== userName) return false;
        } else if (a.creadoPor) {
          if (a.creadoPor !== userName) return false;
        } else {
          const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === userName.trim().toLowerCase());
          if (!isMine) return false;
        }
      }"""

repl = """    const asistenciasFiltradas = asistencias.filter(a => {
      if (userRole.toUpperCase() === "TERAPEUTA") {
        const uName = (userName || "").trim().toLowerCase();
        if (a.terapeuta) {
          if (a.terapeuta.trim().toLowerCase() !== uName) return false;
        } else if (a.creadoPor) {
          if (a.creadoPor.trim().toLowerCase() !== uName) return false;
        } else {
          const isMine = pacientes.some(p => p.paciente === a.paciente && p.medicoTratante?.trim().toLowerCase() === uName);
          if (!isMine) return false;
        }
      }"""

c = c.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated filter in Asistencia")
