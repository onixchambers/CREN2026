import os

path = 'src/app/dashboard/agenda/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add Mixto if there's a payment method in Agenda.
if 'name="metodoPago"' in c:
    c = c.replace('<option value="Transferencia">Transferencia</option>\n                      <option value="Tarjeta">Tarjeta</option>', 
                  '<option value="Transferencia">Transferencia</option>\n                      <option value="Tarjeta">Tarjeta</option>\n                      <option value="Mixto">Mixto</option>')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated Mixto in Agenda")
else:
    print("No metodoPago dropdown found in Agenda")
