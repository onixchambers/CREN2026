import os

path = 'src/app/dashboard/estado-resultados/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = '''        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">'''
repl = '''        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <button onClick={async () => {
            const { getSettings } = await import('@/app/actions/configuracion');
            const res = await getSettings('2026-07');
            alert(JSON.stringify(res.users, null, 2));
          }} className="bg-red-500 text-white px-2 py-1 rounded">Debug Users</button>'''

c = c.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
