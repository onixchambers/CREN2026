import os

path = 'src/app/dashboard/preregistros/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for photo preview and pagination
state_add = '''
  const [fichas, setFichas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
'''
content = content.replace('''
  const [fichas, setFichas] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
''', state_add)

# Add handlePhotoChange
photo_handler = '''
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  useEffect(() => {
'''
content = content.replace('''
  useEffect(() => {
''', photo_handler, 1)

# Modify photo UI
old_photo_ui = '''              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fotografía del Paciente</label>
                <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-md p-1" />
              </div>'''

new_photo_ui = '''              <div className="flex items-center gap-4">
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

content = content.replace(old_photo_ui, new_photo_ui)

# Modify handleLimpiar to reset photo preview
limpiar_logic = '''
  const handleLimpiar = () => {
    setEditingId(null);
    setSearchQuery("");
    setPhotoPreview(null);
'''
content = content.replace('''
  const handleLimpiar = () => {
    setEditingId(null);
    setSearchQuery("");
''', limpiar_logic)

# Pagination logic before return
pagination_calc = '''
  const tableFilteredFichas = fichas.filter(f => userRole.toUpperCase() === "TERAPEUTA" ? f.medicoTratante === userName : true);
  const totalPages = Math.ceil(tableFilteredFichas.length / 25) || 1;
  const currentTableData = tableFilteredFichas.slice((currentPage - 1) * 25, currentPage * 25);

  return (
'''
content = content.replace('''  return (''', pagination_calc)

# Modify table body rendering
old_table_body = '''            <tbody>
              {fichas.filter(f => userRole.toUpperCase() === "TERAPEUTA" ? f.medicoTratante === userName : true).length > 0 ? (
                fichas.filter(f => userRole.toUpperCase() === "TERAPEUTA" ? f.medicoTratante === userName : true).map(f => ('''

new_table_body = '''            <tbody>
              {currentTableData.length > 0 ? (
                currentTableData.map(f => ('''
content = content.replace(old_table_body, new_table_body)

# Add pagination controls below table
pagination_ui = '''          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs font-medium text-slate-500">Mostrando {(currentPage - 1) * 25 + 1} a {Math.min(currentPage * 25, tableFilteredFichas.length)} de {tableFilteredFichas.length} pacientes</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-[#1a5276] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Anterior</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-[#1a5276] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

    </div>'''

content = content.replace('''          </table>
        </div>
      </div>

    </div>''', pagination_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
