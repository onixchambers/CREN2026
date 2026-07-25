import os

path = 'src/app/dashboard/informes/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Dropzone UI
target1 = '''<input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                
                {file ? (
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-green-500 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    <p className="text-[#1a5276] font-bold text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-[#1a5276] opacity-70 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1.5m1.5 0H15m-6 4h6m-6 4h6" /></svg>
                    <p className="text-[#1a5276] font-bold text-[15px]">Arrastra aqu o haz clic</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC, DOCX (mǭx. 5MB)</p>
                  </div>
                )}'''

replacement1 = '''<input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  multiple
                />
                
                {files.length > 0 ? (
                  <div className="w-full h-full p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-bold text-slate-500 mb-2">{files.length} archivo(s) seleccionado(s):</p>
                    <div className="space-y-2">
                      {files.map((f, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border border-slate-200 rounded p-2 text-sm">
                          <div className="flex items-center gap-2 truncate">
                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            <span className="truncate">{f.name}</span>
                          </div>
                          <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 ml-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-10 h-10 mx-auto text-[#1a5276] opacity-70 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1.5m1.5 0H15m-6 4h6m-6 4h6" /></svg>
                    <p className="text-[#1a5276] font-bold text-[15px]">Arrastra aquí o haz clic para múltiples archivos</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC, DOCX</p>
                  </div>
                )}'''

content = content.replace(target1, replacement1)

# Fix "Arrastra aqu" encoding issue
content = content.replace("Arrastra aqu", "Arrastra aquí").replace("mǭx", "máx")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
