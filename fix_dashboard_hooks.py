import os

path = 'src/app/dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_early_return = '''  if (status === "loading" || (status === "authenticated" && ((session?.user as any)?.role || "ADMIN").toUpperCase() === "TERAPEUTA")) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5276]"></div>
        <span className="ml-3 text-slate-500 font-medium">Redirigiendo a Agenda...</span>
      </div>
    );
  }'''

# Remove it from the top
content = content.replace(bad_early_return, "")

# Insert it after the last hook
hook_end = '''  useEffect(() => {
    const aData = localStorage.getItem("asistenciaData");
    if (aData) setAsistencias(JSON.parse(aData));

    const pData = localStorage.getItem("pacientesData");
    if (pData) setPacientes(JSON.parse(pData));
  }, []);'''

good_early_return = hook_end + '\n\n' + bad_early_return

content = content.replace(hook_end, good_early_return)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
