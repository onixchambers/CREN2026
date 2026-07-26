import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """        }
        
        // Cargar asistencias reales de la Agenda"""

repl = """        }
        
        // Cargar asistencias reales de la Agenda"""

# I need to add focus listener
t2 = """          setAsistencias(agendaAsistencias);
      }
      loadData();
    }, [userName, userRole]);"""

r2 = """          setAsistencias(agendaAsistencias);
      }
      loadData();
      const onFocus = () => loadData();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }, [userName, userRole]);"""

c = c.replace(t2, r2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated window focus in Asistencia")
