import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the filter Limpiar button to reset to default dates
old_filter_limpiar = '''<button onClick={() => {setFiltroDesde(""); setFiltroHasta(""); setFiltroEstado("Todos");}} className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors">'''
new_filter_limpiar = '''<button type="button" onClick={() => {setFiltroDesde(hace30DiasStr); setFiltroHasta(hoy); setFiltroEstado("Todos");}} className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-colors">'''
content = content.replace(old_filter_limpiar, new_filter_limpiar)

# Fix the form Limpiar button
old_form_limpiar = '''<button onClick={handleLimpiarForm} className="bg-white border border-slate-300 text-[#1a5276] hover:bg-slate-50 px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">'''
new_form_limpiar = '''<button type="button" onClick={handleLimpiarForm} className="bg-white border border-slate-300 text-[#1a5276] hover:bg-slate-50 px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">'''
content = content.replace(old_form_limpiar, new_form_limpiar)

# Fix the Save button to be type="button" too so it doesn't submit implicitly
old_guardar = '''<button onClick={handleGuardar} className="bg-[#27ae60] hover:bg-[#219653] text-white px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">'''
new_guardar = '''<button type="button" onClick={handleGuardar} className="bg-[#27ae60] hover:bg-[#219653] text-white px-5 py-2 rounded text-[13px] font-semibold flex items-center gap-2 transition-colors">'''
content = content.replace(old_guardar, new_guardar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
