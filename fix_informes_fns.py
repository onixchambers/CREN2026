import os

path = 'src/app/dashboard/informes/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace setFile declarations
content = content.replace('const [file, setFile] = useState<File | null>(null);', '')
content = content.replace('const [files, setFiles] = useState<File[]>([]);\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 25;\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 25;', 'const [files, setFiles] = useState<File[]>([]);\n  const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 25;')

target_functions = '''  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubirInforme = () => {
    if (!selectedPaciente || !selectedTipo || !file) {
      alert("Por favor selecciona paciente, tipo y adjunta un archivo.");
      return;
    }

    const nuevoInforme: Informe = {
      id: Date.now().toString(),
      paciente: selectedPaciente,
      tipo: selectedTipo,
      fecha: selectedFecha,
      archivoNombre: file.name,
      fechaSubida: new Date().toLocaleDateString(),
      terapeuta: userName
    };

    const updated = [nuevoInforme, ...informes];
    setInformes(updated);
    localStorage.setItem("informesData", JSON.stringify(updated));

    setSelectedPaciente("");
    setSearchInput("");
    setSelectedTipo("");
    setFile(null);
  };'''

replacement_functions = '''  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files as FileList)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubirInforme = () => {
    if (!selectedPaciente || !selectedTipo || files.length === 0) {
      alert("Por favor selecciona paciente, tipo y adjunta un archivo.");
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
  };'''

if target_functions in content:
    content = content.replace(target_functions, replacement_functions)
else:
    print("Could not find target functions")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
