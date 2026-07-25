import os

path = 'src/app/dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a check to return null if the user is a therapist, completely preventing rendering
early_return = '''
  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role || "ADMIN";
      if (role.toUpperCase() === "TERAPEUTA") {
        router.push("/dashboard/agenda");
      }
    }
  }, [session, status, router]);

  if (status === "loading" || (status === "authenticated" && ((session?.user as any)?.role || "ADMIN").toUpperCase() === "TERAPEUTA")) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5276]"></div>
        <span className="ml-3 text-slate-500 font-medium">Redirigiendo a Agenda...</span>
      </div>
    );
  }
'''

content = content.replace('''
  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role || "ADMIN";
      if (role.toUpperCase() === "TERAPEUTA") {
        router.push("/dashboard/agenda");
      }
    }
  }, [session, status, router]);
''', early_return)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
