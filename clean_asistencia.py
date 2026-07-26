import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Clean up the refresh and focus logic to avoid immediate disappearance
target = """    useEffect(() => {
      router.refresh(); // FORZAR AL ROUTER A DESCARTAR LA CACHÉ
      async function loadData() {"""
      
repl = """    useEffect(() => {
      async function loadData() {"""

c = c.replace(target, repl)

target_focus = """      }
      loadData();
      const onFocus = () => loadData();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }, [userName, userRole]);"""

repl_focus = """      }
      loadData();
    }, [userName, userRole]);"""

c = c.replace(target_focus, repl_focus)

# Add timestamp to getAsistenciasDB to bypass any cache! Wait, getAsistenciasDB doesn't take arguments yet. I'll just change the call if possible or pass it.
# Actually I'll just rely on the removal of router.refresh() because I think that was what made it disappear immediately!

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Removed router.refresh and focus from Asistencia")
