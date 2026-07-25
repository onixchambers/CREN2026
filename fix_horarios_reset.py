import os

path = 'src/app/dashboard/horarios/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useEffects
old_effect = '''  useEffect(() => {
    async function loadTerapeutas() {
      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        if (userRole.toUpperCase() === "TERAPEUTA") {
          setTerapeutasDisponibles([userName]);
          setTerapeutaSeleccionado(userName);
        } else {
          setTerapeutasDisponibles(res.terapeutas);
        }
      }
    }
    loadTerapeutas();

    // Actualizar reloj cada segundo
    const interval = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);'''

new_effect = '''  useEffect(() => {
    async function loadTerapeutas() {
      const res = await getTerapeutas();
      if (res.success && res.terapeutas) {
        if (userRole.toUpperCase() === "TERAPEUTA") {
          setTerapeutasDisponibles([userName]);
          setTerapeutaSeleccionado(userName);
        } else {
          setTerapeutasDisponibles(res.terapeutas);
        }
      }
    }
    if (userName) {
      loadTerapeutas();
    }
  }, [userName, userRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);'''

content = content.replace(old_effect, new_effect)

# 2. Update registrarEntrada to not clear if Terapeuta
old_entrada_clear = '''    setHorarios([nuevoHorario, ...horarios]);
    setTerapeutaSeleccionado("");
  };'''

new_entrada_clear = '''    setHorarios([nuevoHorario, ...horarios]);
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };'''
content = content.replace(old_entrada_clear, new_entrada_clear)

# 3. Update registrarSalida to not clear if Terapeuta
old_salida_clear = '''    } else {
      alert("Este terapeuta no tiene una entrada activa registrada.");
    }
    
    setTerapeutaSeleccionado("");
  };'''

new_salida_clear = '''    } else {
      alert("Este terapeuta no tiene una entrada activa registrada.");
    }
    
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };'''
content = content.replace(old_salida_clear, new_salida_clear)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
