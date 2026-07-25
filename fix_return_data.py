import os

path = 'src/app/actions/finanzas.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the return structure of getFinanzasMensuales to match what estado-resultados expects:
# It expects res.data to contain ingresosBrutos, nomina, gastosOperativos, gastosList, ivaHonorarios, utilidadNeta, terapeutas.
target_return = '''    return {
      success: true,
      datos: {
        ingresosBrutos, // Esto es el dinero total que entró
        totalNomina,
        totalGastosOperativos,
        utilidadBruta,
        utilidadNeta,
        margenUtilidad,
        ivaHonorarios: ivaTotal // Se mostrará como impuesto a restar
      },
      terapeutas: terapeutasData,
      gastos
    };'''

replacement_return = '''    return {
      success: true,
      data: {
        ingresosBrutos,
        nomina: totalNomina,
        gastosOperativos: totalGastosOperativos,
        gastosList: gastos,
        ivaHonorarios: ivaTotal,
        utilidadNeta: utilidadNeta,
        terapeutas: terapeutasData,
        utilidadBruta,
        margenUtilidad
      }
    };'''

content = content.replace(target_return, replacement_return)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
