import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_horas = '''const HORAS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00"
];'''

new_horas = '''const HORAS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00", "21:00", "22:00"
];'''

content = content.replace(old_horas, new_horas)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
