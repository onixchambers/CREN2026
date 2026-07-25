import os

path = 'src/app/dashboard/informes/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add `data?: string;` to `Informe` interface
content = content.replace(
'''type Informe = {
  id: string;
  paciente: string;
  tipo: string;
  fecha: string;
  archivoNombre: string;
  fechaSubida: string;
  terapeuta?: string;
};''',
'''type Informe = {
  id: string;
  paciente: string;
  tipo: string;
  fecha: string;
  archivoNombre: string;
  fechaSubida: string;
  terapeuta?: string;
  data?: string; // Base64 data for download
};''')

# 2. Update handleSubirInforme to read files as DataURL
target_upload = '''  const handleSubirInforme = () => {
    if (!selectedPaciente || !selectedTipo || files.length === 0) {
      alert("Por favor selecciona paciente, tipo y adjunta al menos un archivo.");
      return;
    }

    const nuevosInformes: Informe[] = files.map((f, index) => ({
      id: Date.now().toString() + index,
      paciente: selectedPaciente,
      tipo: selectedTipo,
      fecha: selectedFecha,
      archivoNombre: f.name,
      fechaSubida: new Date().toLocaleDateString(),
      terapeuta: userName
    }));

    const updated = [...nuevosInformes, ...informes];
    setInformes(updated);
    localStorage.setItem("informesData", JSON.stringify(updated));

    setSelectedPaciente("");
    setSearchInput("");
    setSelectedTipo("");
    setFiles([]);
    alert("Informe subido exitosamente");
  };'''

replacement_upload = '''  const handleSubirInforme = async () => {
    if (!selectedPaciente || !selectedTipo || files.length === 0) {
      alert("Por favor selecciona paciente, tipo y adjunta al menos un archivo.");
      return;
    }

    const readAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    };

    const nuevosInformes: Informe[] = [];
    
    for (let index = 0; index < files.length; index++) {
      const f = files[index];
      try {
        const data = await readAsDataURL(f);
        nuevosInformes.push({
          id: Date.now().toString() + index,
          paciente: selectedPaciente,
          tipo: selectedTipo,
          fecha: selectedFecha,
          archivoNombre: f.name,
          fechaSubida: new Date().toLocaleDateString(),
          terapeuta: userName,
          data: data
        });
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }

    const updated = [...nuevosInformes, ...informes];
    
    // Si excede el almacenamiento local por tamaño de archivo, se captura el error
    try {
      localStorage.setItem("informesData", JSON.stringify(updated));
      setInformes(updated);
      setSelectedPaciente("");
      setSearchInput("");
      setSelectedTipo("");
      setFiles([]);
      alert("Informe subido exitosamente");
    } catch (error) {
      alert("Error: Archivo muy grande para guardar en modo prueba. Se alcanzó el límite de almacenamiento del navegador.");
    }
  };'''

content = content.replace(target_upload, replacement_upload)

# 3. Add Autocomplete to the filter (Informes Registrados)
target_filter = '''                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">BUSCAR PACIENTE</label>
                <input 
                  type="text"
                  placeholder="Nombre del paciente..."
                  value={filtroPaciente}
                  onChange={e => setFiltroPaciente(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"
                />'''

replacement_filter = '''                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">BUSCAR PACIENTE</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Escribe para buscar..."
                    value={filtroPaciente}
                    onFocus={() => setShowFiltroDropdown(true)}
                    onBlur={() => setTimeout(() => setShowFiltroDropdown(false), 200)}
                    onChange={e => setFiltroPaciente(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"
                  />
                  {showFiltroDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {pacientes.filter(p => p.paciente.toLowerCase().includes(filtroPaciente.toLowerCase())).length > 0 ? (
                        pacientes.filter(p => p.paciente.toLowerCase().includes(filtroPaciente.toLowerCase())).map((p) => (
                          <div 
                            key={p.id}
                            className="p-2 text-sm text-slate-700 hover:bg-[#2980b9] hover:text-white cursor-pointer"
                            onMouseDown={() => {
                              setFiltroPaciente(p.paciente);
                              setShowFiltroDropdown(false);
                            }}
                          >
                            {p.paciente}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-slate-500">No se encontraron pacientes.</div>
                      )}
                    </div>
                  )}
                </div>'''

content = content.replace(target_filter, replacement_filter)

# 4. Show fechaSubida in table, and change "Archivo" column to be a Download link
target_table = '''                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-4 py-3">Tipo de Informe</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Archivo Adjunto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInformes.map((inf) => (
                      <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1a5276]">{inf.paciente}</p>
                          <p className="text-[11px] text-slate-400">ID: {inf.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs font-semibold">
                            {inf.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                          {formatDateStr(inf.fecha)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2 text-[#2980b9] font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            {inf.archivoNombre}
                          </div>
                        </td>
                      </tr>
                    ))}'''

replacement_table = '''                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-4 py-3">Tipo de Informe</th>
                      <th className="px-4 py-3">Fechas</th>
                      <th className="px-4 py-3">Archivo Adjunto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInformes.map((inf) => (
                      <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1a5276]">{inf.paciente}</p>
                          <p className="text-[11px] text-slate-400">ID: {inf.id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs font-semibold">
                            {inf.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-medium leading-tight">
                          <div><span className="text-xs text-slate-400">Evaluación:</span> {formatDateStr(inf.fecha)}</div>
                          <div><span className="text-xs text-slate-400">Subido:</span> {inf.fechaSubida}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {inf.data ? (
                            <a href={inf.data} download={inf.archivoNombre} className="flex items-center gap-2 text-[#2980b9] font-semibold hover:underline">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Descargar {inf.archivoNombre}
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 text-[#2980b9] font-semibold">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              {inf.archivoNombre}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}'''

content = content.replace(target_table, replacement_table)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
