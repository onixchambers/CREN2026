import os

path = 'src/app/dashboard/preregistros/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleEdit to map name to nombre
old_handleEdit = '''  const handleEdit = (ficha: any) => {
    setEditingId(ficha.id);
    setFormData({
      ...formData,
      ...ficha
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };'''

new_handleEdit = '''  const handleEdit = (ficha: any) => {
    setEditingId(ficha.id);
    setFormData({
      ...formData,
      ...ficha,
      nombre: ficha.name || ficha.nombre || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };'''
content = content.replace(old_handleEdit, new_handleEdit)

# 2. Make the photo bigger
old_photo_ui = '''              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fotografía del Paciente</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-md p-1" />
                </div>
              </div>'''

new_photo_ui = '''              <div className="flex items-center gap-6">
                <div className="w-40 h-40 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fotografía del Paciente</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-300 rounded-md p-2 cursor-pointer transition-colors" />
                  <p className="text-[10px] text-slate-400 mt-2">Formatos soportados: JPG, PNG, GIF.</p>
                </div>
              </div>'''
content = content.replace(old_photo_ui, new_photo_ui)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
