import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target1 = """  const [terapeutas, setTerapeutas] = useState<string[]>([]);

  // Predictivo"""
repl1 = """  const [terapeutas, setTerapeutas] = useState<string[]>([]);
  const [terapeutasFullData, setTerapeutasFullData] = useState<any[]>([]);

  // Predictivo"""

target2 = """        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          const areas = Array.from(new Set(tRes.data.map((t: any) => t.especialidad).filter(Boolean)));
          
          if (userRole.toUpperCase() === "TERAPEUTA") {
            const matched = tRes.data.find((t: any) => t.name.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(t.name.toLowerCase()));
            const miTerapeutaStr = matched ? matched.name : (tRes.data[0]?.name || userName);
            const miAreaStr = matched ? matched.especialidad : "";
            
            setAvailableAreas(miAreaStr ? [miAreaStr] : (areas.length > 0 ? areas as string[] : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]));
            setTerapeutas([miTerapeutaStr]);
            setFormData(prev => ({...prev, terapeuta: miTerapeutaStr, area: miAreaStr}));
          } else {
            setAvailableAreas(areas.length > 0 ? areas as string[] : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
            setTerapeutas(tRes.data.map((t: any) => t.name));
          }
        }"""
repl2 = """        const tRes = await getTerapeutasFull();
        if (tRes.success && tRes.data) {
          setTerapeutasFullData(tRes.data);
          let allAreas: string[] = [];
          tRes.data.forEach((t: any) => {
            if (t.especialidad) {
              const parts = t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
              allAreas = allAreas.concat(parts);
            }
          });
          const areas = Array.from(new Set(allAreas));
          
          if (userRole.toUpperCase() === "TERAPEUTA") {
            const matched = tRes.data.find((t: any) => t.name.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(t.name.toLowerCase()));
            const miTerapeutaStr = matched ? matched.name : (tRes.data[0]?.name || userName);
            const miAreaStr = matched ? matched.especialidad : "";
            let misAreas: string[] = [];
            if (miAreaStr) misAreas = miAreaStr.split(',').map((x: string) => x.trim()).filter(Boolean);
            
            setAvailableAreas(misAreas.length > 0 ? misAreas : (areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]));
            setTerapeutas([miTerapeutaStr]);
            setFormData(prev => ({...prev, terapeuta: miTerapeutaStr, area: misAreas[0] || ""}));
          } else {
            setAvailableAreas(areas.length > 0 ? areas : ["Psicología", "Lenguaje", "Fisioterapia", "Terapia Ocupacional"]);
            setTerapeutas(tRes.data.map((t: any) => t.name));
          }
        }"""

if target1 in c and target2 in c:
    c = c.replace(target1, repl1)
    c = c.replace(target2, repl2)
    print("Replaced terapeutas parsing")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
