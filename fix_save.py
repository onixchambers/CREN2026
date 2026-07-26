import os

path = 'src/app/actions/asistencia.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# I will replace the construction of `extra` to include the package logic.
target = """
    // Datos financieros a guardar
    const estadoVal = data.estado || data.estadoAsistencia || "";
    const extra = {
      asistenciaGuardada: true,
"""
replacement = """
    // Calcular paquete actual
    let paqueteActual = 1;
    const sesionesInt = parseInt(data.sesiones || data.numeroSesiones || "1");
    if (sesionesInt > 1) {
      // Buscar sesion anterior con el mismo paquete
      const pastSessions = [...existingSessions].sort((a, b) => b.date.getTime() - a.date.getTime());
      for (const s of pastSessions) {
        if (!s.notes) continue;
        try {
          const e = JSON.parse(s.notes);
          if (e.asistenciaGuardada && parseInt(e.sesiones) === sesionesInt && (e.fecha !== data.fecha)) {
            if (e.paqueteActual && e.paqueteActual < sesionesInt) {
              paqueteActual = e.paqueteActual + 1;
              break;
            }
          }
        } catch(err) {}
      }
    }

    // Calcular saldo
    let saldo = 0;
    const montoP = parseFloat(data.montoPago || "0");
    const costoS = parseFloat(data.costoSesion || data.precioTerapia || "0");
    if (costoS > 0 || montoP > 0) {
      saldo = montoP - costoS;
    }

    // Datos financieros a guardar
    const estadoVal = data.estado || data.estadoAsistencia || "";
    const extra = {
      asistenciaGuardada: true,
      paqueteActual: paqueteActual,
      saldo: saldo,
      montoPago: data.montoPago || "",
      costoSesion: data.costoSesion || data.precioTerapia || "",
"""
c = c.replace(target, replacement)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated saveAsistenciaDB with package and saldo logic.")
