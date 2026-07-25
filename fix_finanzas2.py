import os

path = 'src/app/actions/finanzas.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove fake ingresosBrutos
target1 = '''    let ingresosBrutos = 0;
    pacientes.forEach(p => {
      const precio = parseFloat(p.precioTerapia || "0");
      if (!isNaN(precio) && precio > 0) {
        ingresosBrutos += (precio * 4);
      }
    });
    if (ingresosBrutos === 0) ingresosBrutos = 12500;'''

replacement1 = '''    let ingresosBrutos = 0;
    // En un sistema real, leerías de las sesiones/citas reales marcadas como 'pagadas' o 'completadas'.
    // Por ahora sumamos los precios de las terapias de pacientes activos si existen.
    pacientes.forEach(p => {
      const precio = parseFloat(p.precioTerapia || "0");
      if (!isNaN(precio) && precio > 0) {
        ingresosBrutos += (precio * 4); // Asumiendo 4 terapias mensuales (debe ser dinámico después)
      }
    });'''

# Remove fake terapeutas data
target2 = '''    const terapeutasData = terapeutas.map(t => {
      const sesiones = Math.floor(Math.random() * 20) + 10;
      const ingresoGenerado = sesiones * 40;
      
      let pago = 0;
      if (t.tipoPago === "Porcentaje") {
        pago = ingresoGenerado * ((t.porcentaje || 50) / 100);
      } else {
        pago = t.salarioBase || 0;
      }

      return {
        id: t.id,
        nombre: t.name || "Terapeuta",
        especialidad: t.especialidad || "General",
        sesiones,
        ingresoGenerado,
        pago,
        tipoPago: t.tipoPago,
        porcentaje: t.porcentaje,
        salarioBase: t.salarioBase
      };
    });'''

replacement2 = '''    const terapeutasData = terapeutas.map(t => {
      const sesiones = 0; // Sin sesiones reales aún
      const ingresoGenerado = 0;
      
      let pago = 0;
      if (t.tipoPago === "Salario Base") {
        pago = t.salarioBase || 0;
      } else {
        pago = ingresoGenerado * ((t.porcentaje || 0) / 100);
      }

      return {
        id: t.id,
        nombre: t.name || "Terapeuta",
        especialidad: t.especialidad || "General",
        sesiones,
        ingresoGenerado,
        pago,
        tipoPago: t.tipoPago,
        porcentaje: t.porcentaje,
        salarioBase: t.salarioBase
      };
    });'''

# Remove fake gastos
target3 = '''    const gastosDefault = [
      { id: "1", label: "Renta de Local", amount: 1500 },
      { id: "2", label: "Luz y Agua", amount: 200 },
      { id: "3", label: "Internet y Teléfono", amount: 100 },
      { id: "4", label: "Material de Limpieza", amount: 150 },
    ];

    const gastos = gastosData.length > 0 ? gastosData : gastosDefault;'''

replacement3 = '''    const gastos = gastosData;'''

content = content.replace(target1, replacement1).replace(target2, replacement2).replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
