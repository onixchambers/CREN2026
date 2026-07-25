import os

path = 'src/app/dashboard/informes/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = "const [file, setFile] = useState<File | null>(null);"
replacement1 = "const [files, setFiles] = useState<File[]>([]);\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 25;"

target2 = "const [showDropdown, setShowDropdown] = useState(false);"
replacement2 = "const [showDropdown, setShowDropdown] = useState(false);\n  const [showFiltroDropdown, setShowFiltroDropdown] = useState(false);"

target3 = '''const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubirInforme = () => {
    if (!selectedPaciente || !selectedTipo || !file) {
      alert("Por favor completa todos los campos.");
      return;
    }
    
    const newId = (informes.length + 1).toString();
    const newInforme: Informe = {
      id: newId,
      paciente: selectedPaciente,
      tipo: selectedTipo,
      fecha: selectedFecha,
      archivo: file.name
    };

    setInformes([newInforme, ...informes]);
    
    // Reset form
    setSelectedPaciente("");
    setSearchInput("");
    setSelectedTipo("");
    setFile(null);
  };'''
replacement3 = '''const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files as FileList)]);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubirInforme = () => {
    if (!selectedPaciente || !selectedTipo || files.length === 0) {
      alert("Por favor completa todos los campos y adjunta al menos un archivo.");
      return;
    }
    
    const newInformes = files.map((f, i) => ({
      id: Date.now().toString() + i,
      paciente: selectedPaciente,
      tipo: selectedTipo,
      fecha: selectedFecha,
      archivo: f.name
    }));

    setInformes([...newInformes, ...informes]);
    
    // Reset form
    setSelectedPaciente("");
    setSearchInput("");
    setSelectedTipo("");
    setFiles([]);
  };'''

target4 = '''{showDropdown && searchInput && ('''
replacement4 = '''{showDropdown && ('''

content = content.replace(target1, replacement1).replace(target2, replacement2).replace(target3, replacement3).replace(target4, replacement4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
