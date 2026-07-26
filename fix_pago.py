import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add "Mixto" to the select options
c = c.replace('<option value="Transferencia">Transferencia</option>\n                    <option value="Tarjeta">Tarjeta</option>', 
              '<option value="Transferencia">Transferencia</option>\n                    <option value="Tarjeta">Tarjeta</option>\n                    <option value="Mixto">Mixto</option>')
c = c.replace('<option value="Transferencia">Transferencia</option>\n                      <option value="Tarjeta">Tarjeta</option>', 
              '<option value="Transferencia">Transferencia</option>\n                      <option value="Tarjeta">Tarjeta</option>\n                      <option value="Mixto">Mixto</option>')

# Change the logic in handleLimpiarForm -> submit
# "pago: formData.metodoPago," -> "pago: parseFloat(formData.montoPago || '0') > 0 ? 'SÍ' : formData.metodoPago,"
c = c.replace('pago: formData.metodoPago,', 'pago: parseFloat(formData.montoPago || "0") > 0 ? "SÍ" : formData.metodoPago,')

# Wait, in Asistencia, handleLimpiarForm does setFormData. But handleSubmit uses formData.
c = c.replace('pago: editForm.pago,', 'pago: parseFloat(editForm.montoPago || "0") > 0 ? "SÍ" : editForm.pago,')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated pago logic")
