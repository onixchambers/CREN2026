import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """  const hoy = new Date().toISOString().split("T")[0];
  const [filtroDesde, setFiltroDesde] = useState(hoy);"""
  
repl = """  const hoy = new Date().toISOString().split("T")[0];
  
  // By default, show records from the 1st of the current month
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  };
  
  const [filtroDesde, setFiltroDesde] = useState(getFirstDayOfMonth());"""

c = c.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated filtroDesde default to first day of the month")
