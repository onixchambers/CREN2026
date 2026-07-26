import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };"""

repl = """  useEffect(() => {
    if (userRole.toUpperCase() !== "TERAPEUTA" && formData.terapeuta && terapeutasFullData.length > 0) {
      const match = terapeutasFullData.find(t => t.name === formData.terapeuta);
      if (match && match.especialidad) {
        const parts = match.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean);
        setAvailableAreas(parts);
        if (!parts.includes(formData.area)) {
          setFormData(prev => ({ ...prev, area: parts[0] || "" }));
        }
      } else {
        let allAreas: string[] = [];
        terapeutasFullData.forEach(t => {
          if (t.especialidad) {
            allAreas = allAreas.concat(t.especialidad.split(',').map((x: string) => x.trim()).filter(Boolean));
          }
        });
        setAvailableAreas(Array.from(new Set(allAreas)));
      }
    }
  }, [formData.terapeuta, terapeutasFullData, userRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };"""

if target in c:
    c = c.replace(target, repl)
    print("Replaced handleChange block with useEffect")
else:
    print("Target not found")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
