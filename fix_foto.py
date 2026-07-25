import os

path = 'src/app/dashboard/preregistros/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add foto to formData state
content = content.replace('observacionesAdmin: ""', 'observacionesAdmin: "",\n    foto: ""')

# 2. Update handlePhotoChange to convert to base64 and set formData.foto
old_photo_handler = '''  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };'''

new_photo_handler = '''  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData(prev => ({ ...prev, foto: base64String }));
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
      setFormData(prev => ({ ...prev, foto: "" }));
    }
  };'''
content = content.replace(old_photo_handler, new_photo_handler)

# 3. Handle edit - load photoPreview from ficha.foto
old_handle_edit = '''  const handleEdit = (ficha: any) => {
    setEditingId(ficha.id);
    setFormData({
      ...formData,
      ...ficha,
      nombre: ficha.name || ficha.nombre || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };'''

new_handle_edit = '''  const handleEdit = (ficha: any) => {
    setEditingId(ficha.id);
    setFormData({
      ...formData,
      ...ficha,
      nombre: ficha.name || ficha.nombre || "",
      foto: ficha.foto || ""
    });
    setPhotoPreview(ficha.foto || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };'''
content = content.replace(old_handle_edit, new_handle_edit)

# 4. Handle limpiar - clear foto
old_limpiar = '''  const handleLimpiar = () => {
    setEditingId(null);
    setSearchQuery("");
    setPhotoPreview(null);
    setFormData({
      ...formData,
      nombre: "", fechaNacimiento: "", sexo: "", origen: "Google", medicoTratante: "", escuela: "",
      madreNombre: "", padreNombre: "", otrosNombre: "", madreContacto: "", padreContacto: "", otrosContacto: "",
      principalMadre: false, principalPadre: false, principalOtros: false, correoPrincipal: "",
      alergias: false, crisis: false, convulsiones: false, sensibilidad: false, riesgoFuga: false, noSepara: false, otrasAlertas: false,
      reglamentoFirmado: false, consentimientoFirmado: false, observacionesAdmin: ""
    });
  };'''

new_limpiar = '''  const handleLimpiar = () => {
    setEditingId(null);
    setSearchQuery("");
    setPhotoPreview(null);
    setFormData({
      ...formData,
      nombre: "", fechaNacimiento: "", sexo: "", origen: "Google", medicoTratante: "", escuela: "", foto: "",
      madreNombre: "", padreNombre: "", otrosNombre: "", madreContacto: "", padreContacto: "", otrosContacto: "",
      principalMadre: false, principalPadre: false, principalOtros: false, correoPrincipal: "",
      alergias: false, crisis: false, convulsiones: false, sensibilidad: false, riesgoFuga: false, noSepara: false, otrasAlertas: false,
      reglamentoFirmado: false, consentimientoFirmado: false, observacionesAdmin: ""
    });
  };'''
content = content.replace(old_limpiar, new_limpiar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# --- 5. update schema.prisma ---
schema_path = 'prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    schema = f.read()

schema = schema.replace('observacionesAdmin  String?', 'observacionesAdmin  String?\n    foto            String?')

with open(schema_path, 'w', encoding='utf-8') as f:
    f.write(schema)


# --- 6. update src/app/actions/pacientes.ts ---
actions_path = 'src/app/actions/pacientes.ts'
with open(actions_path, 'r', encoding='utf-8') as f:
    actions = f.read()

actions = actions.replace('observacionesAdmin: data.observacionesAdmin || null,', 'observacionesAdmin: data.observacionesAdmin || null,\n        foto: data.foto || null,')

with open(actions_path, 'w', encoding='utf-8') as f:
    f.write(actions)

# --- 7. update API route to run migration for foto column ---
api_path = 'src/app/api/migrate/route.ts'
with open(api_path, 'r', encoding='utf-8') as f:
    api = f.read()

api = api.replace('return NextResponse.json({ success: true, message: "Table Horario created successfully" });', '''
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "foto" TEXT;
    `);
    return NextResponse.json({ success: true, message: "Migrations executed successfully" });''')

with open(api_path, 'w', encoding='utf-8') as f:
    f.write(api)

