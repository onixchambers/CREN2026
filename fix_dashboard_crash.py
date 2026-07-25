import os

path = 'src/app/dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_phoy = '''  const pHoy = pacientes.filter(p => isToday(p.id ? new Date(parseInt(p.id)).toISOString().split("T")[0] : "")).length;
  const pSemana = pacientes.filter(p => isThisWeek(p.id ? new Date(parseInt(p.id)).toISOString().split("T")[0] : "")).length;
  const pMes = pacientes.filter(p => isThisMonth(p.id ? new Date(parseInt(p.id)).toISOString().split("T")[0] : "")).length;'''

good_phoy = '''  const getPatientDateStr = (p: any) => {
    try {
      if (p.createdAt) return new Date(p.createdAt).toISOString().split("T")[0];
      if (p.fechaIngreso) return new Date(p.fechaIngreso).toISOString().split("T")[0];
      if (p.id && !isNaN(Number(p.id))) return new Date(parseInt(p.id)).toISOString().split("T")[0];
    } catch (e) {}
    return "";
  };

  const pHoy = pacientes.filter(p => isToday(getPatientDateStr(p))).length;
  const pSemana = pacientes.filter(p => isThisWeek(getPatientDateStr(p))).length;
  const pMes = pacientes.filter(p => isThisMonth(getPatientDateStr(p))).length;'''

content = content.replace(bad_phoy, good_phoy)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
