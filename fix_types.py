import re

with open('src/app/dashboard/asistencia/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

type_orig = '''type Paciente = {
  id: string;
  paciente: string;
  sexo: string;
  nac: string;
  edad: string;
};'''
type_new = '''type Paciente = {
  id: string;
  paciente: string;
  sexo: string;
  nac: string;
  edad: string;
  medicoTratante?: string;
};'''
content = content.replace(type_orig, type_new)

with open('src/app/dashboard/asistencia/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
