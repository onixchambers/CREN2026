import re

with open('src/app/dashboard/agenda/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add style for Disponible
style_disponible = """      if (est === "disponible") {
        return {
          className: "bg-blue-50/90 text-blue-900 border-blue-300 font-bold shadow-sm border-dashed",
          style: { color: "#1e3a8a", backgroundColor: "rgba(239, 246, 255, 0.85)" }
        };
      }
      if (est === "agendado" || est === "alta") {"""
content = content.replace('      if (est === "agendado" || est === "alta") {', style_disponible)

# 2. Render Day View
day_render_old = "{cita.hora} - {cita.paciente === 'No Disponible' ? 'Bloq.' : cita.paciente.split(' ')[0]}"
day_render_new = "{cita.hora} - {cita.estado === 'Disponible' ? 'DISPONIBLE' : (cita.paciente === 'No Disponible' ? 'Bloq.' : cita.paciente.split(' ')[0])}"
content = content.replace(day_render_old, day_render_new)

# 3. Render Week View (Terapeuta)
terapeuta_render1_old = "{(cita.estado === \"Ocupado\" || cita.estado === \"No Disponible\" || cita.paciente === \"No Disponible\") ? \"No Disp.\" : cita.paciente.split(' ')[0]}"
terapeuta_render1_new = "{cita.estado === 'Disponible' ? 'DISPONIBLE' : ((cita.estado === \"Ocupado\" || cita.estado === \"No Disponible\" || cita.paciente === \"No Disponible\") ? \"No Disp.\" : cita.paciente.split(' ')[0])}"
content = content.replace(terapeuta_render1_old, terapeuta_render1_new)

terapeuta_render2_old = "{(cita.estado === \"Ocupado\" || cita.estado === \"No Disponible\" || cita.paciente === \"No Disponible\") ? \"Bloqueado\" : (cita.estado || \"Agendado\")}"
terapeuta_render2_new = "{cita.estado === 'Disponible' ? 'Abierto' : ((cita.estado === \"Ocupado\" || cita.estado === \"No Disponible\" || cita.paciente === \"No Disponible\") ? \"Bloqueado\" : (cita.estado || \"Agendado\"))}"
content = content.replace(terapeuta_render2_old, terapeuta_render2_new)

# 4. Render Week View (Admin)
admin_render1_old = "{(cita.estado === \"Ocupado\" || cita.estado === \"No Disponible\" || cita.paciente === \"No Disponible\") ? \"No Disponible\" : cita.paciente}"
admin_render1_new = "{cita.estado === 'Disponible' ? 'DISPONIBLE' : ((cita.estado === \"Ocupado\" || cita.estado === \"No Disponible\" || cita.paciente === \"No Disponible\") ? \"No Disponible\" : cita.paciente)}"
content = content.replace(admin_render1_old, admin_render1_new)

# 5. Form Patient Input
patient_label_old = "Nombre del Paciente {formData.estado === \"Ocupado\" && <span className=\"text-red-500 font-bold\">(Bloqueado)</span>}"
patient_label_new = "Nombre del Paciente {formData.estado === \"Ocupado\" && <span className=\"text-red-500 font-bold\">(Bloqueado)</span>}{formData.estado === \"Disponible\" && <span className=\"text-blue-500 font-bold ml-1\">(Horario Abierto)</span>}"
content = content.replace(patient_label_old, patient_label_new)

patient_req_old = 'required={formData.estado !== "Ocupado"}'
patient_req_new = 'required={formData.estado !== "Ocupado" && formData.estado !== "Disponible"}'
content = content.replace(patient_req_old, patient_req_new)

patient_dis_old = 'disabled={formData.estado === "Ocupado"}'
patient_dis_new = 'disabled={formData.estado === "Ocupado" || formData.estado === "Disponible"}'
content = content.replace(patient_dis_old, patient_dis_new)

patient_val_old = 'value={formData.estado === "Ocupado" ? "No Disponible" : formData.paciente}'
patient_val_new = 'value={formData.estado === "Ocupado" ? "No Disponible" : (formData.estado === "Disponible" ? "Disponible" : formData.paciente)}'
content = content.replace(patient_val_old, patient_val_new)

patient_class_old = 'className={`w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] ${formData.estado === "Ocupado" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}'
patient_class_new = 'className={`w-full text-slate-900 font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#2980b9] ${(formData.estado === "Ocupado" || formData.estado === "Disponible") ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""}`}'
content = content.replace(patient_class_old, patient_class_new)

patient_ph_old = 'placeholder={formData.estado === "Ocupado" ? "No Disponible" : "Escribir para buscar paciente..."}'
patient_ph_new = 'placeholder={formData.estado === "Ocupado" ? "No Disponible" : (formData.estado === "Disponible" ? "Disponible" : "Escribir para buscar paciente...")}'
content = content.replace(patient_ph_old, patient_ph_new)

dropdown_cond_old = '{showDropdown && formData.estado !== "Ocupado" && ('
dropdown_cond_new = '{showDropdown && formData.estado !== "Ocupado" && formData.estado !== "Disponible" && ('
content = content.replace(dropdown_cond_old, dropdown_cond_new)

# 6. Disable other inputs
content = content.replace('select disabled={formData.estado === "Ocupado"} name="tipoServicio"', 'select disabled={formData.estado === "Ocupado" || formData.estado === "Disponible"} name="tipoServicio"')
content = content.replace('select disabled={formData.estado === "Ocupado"} name="frecuencia"', 'select disabled={formData.estado === "Ocupado" || formData.estado === "Disponible"} name="frecuencia"')
content = content.replace('input disabled={formData.estado === "Ocupado"} required type="number" min="1" max="100" name="numeroSesiones"', 'input disabled={formData.estado === "Ocupado" || formData.estado === "Disponible"} required type="number" min="1" max="100" name="numeroSesiones"')

content = content.replace('value={formData.estado === "Ocupado" ? "unica" : formData.frecuencia}', 'value={(formData.estado === "Ocupado" || formData.estado === "Disponible") ? "unica" : formData.frecuencia}')
content = content.replace('value={formData.estado === "Ocupado" ? 1 : formData.numeroSesiones}', 'value={(formData.estado === "Ocupado" || formData.estado === "Disponible") ? 1 : formData.numeroSesiones}')


# 7. Add option to select
select_opt_old = '<option value="Ocupado">Ocupado (Terapeuta No Disponible)</option>'
select_opt_new = '<option value="Disponible">Disponible (Horario Abierto)</option>\n                      <option value="Ocupado">Ocupado (Terapeuta No Disponible)</option>'
content = content.replace(select_opt_old, select_opt_new)

with open('src/app/dashboard/agenda/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Agenda patched")
