# -*- coding: utf-8 -*-
with open("src/app/dashboard/preregistros/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start = content.find("1. DATOS GENERALES DEL PACIENTE")
end = content.find("Guardar Información", start)
if end == -1: end = len(content)

with open("form_snippet.txt", "w", encoding="utf-8") as f:
    f.write(content[max(0, start-100):end+100])