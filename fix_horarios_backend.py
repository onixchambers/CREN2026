import os

path = 'src/app/dashboard/horarios/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_imports = '''import { useSession } from "next-auth/react";
import { getTerapeutas } from "@/app/actions/configuracion";'''

new_imports = '''import { useSession } from "next-auth/react";
import { getTerapeutas } from "@/app/actions/configuracion";
import { registrarEntrada, registrarSalida, getHorariosHoy } from "@/app/actions/horarios";'''
content = content.replace(old_imports, new_imports)

# 2. Update Horario interface
old_interface = '''interface Horario {
  id: number;
  terapeuta: string;
  horaEntrada: string;
  horaSalida?: string;
}'''

new_interface = '''interface Horario {
  id: string;
  terapeuta: string;
  horaEntrada: string;
  horaSalida: string | null;
}'''
content = content.replace(old_interface, new_interface)

# 3. Update useEffect and polling
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

new_effect = '''  const fetchHorarios = async () => {
    const res = await getHorariosHoy();
    if (res.success && res.data) {
      setHorarios(res.data);
    }
  };

  useEffect(() => {
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
      fetchHorarios();
    }
  }, [userName, userRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    
    // Polling auto-refresh de la base de datos cada 10 segundos
    const syncInterval = setInterval(() => {
      fetchHorarios();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);'''
content = content.replace(old_effect, new_effect)

# 4. Update registrarEntrada function
old_entrada = '''  const registrarEntrada = () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }

    const nuevoHorario: Horario = {
      id: Date.now(),
      terapeuta: terapeutaSeleccionado,
      horaEntrada: new Date().toLocaleTimeString(),
    };

    setHorarios([nuevoHorario, ...horarios]);
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };'''

new_entrada = '''  const handleEntrada = async () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }
    
    const res = await registrarEntrada(terapeutaSeleccionado);
    if (!res.success) {
      alert(res.error || "Error al registrar entrada");
      return;
    }

    await fetchHorarios();
    
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };'''
content = content.replace(old_entrada, new_entrada)

# 5. Update registrarSalida function
old_salida = '''  const registrarSalida = () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }

    // Buscar si ya tiene una entrada hoy
    const index = horarios.findIndex(h => h.terapeuta === terapeutaSeleccionado && !h.horaSalida);
    
    if (index !== -1) {
      const nuevosHorarios = [...horarios];
      nuevosHorarios[index] = {
        ...nuevosHorarios[index],
        horaSalida: new Date().toLocaleTimeString()
      };
      setHorarios(nuevosHorarios);
    } else {
      alert("Este terapeuta no tiene una entrada activa registrada.");
    }
    
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };'''

new_salida = '''  const handleSalida = async () => {
    if (!terapeutaSeleccionado) {
      alert("Selecciona un terapeuta primero.");
      return;
    }

    const res = await registrarSalida(terapeutaSeleccionado);
    if (!res.success) {
      alert(res.error || "Error al registrar salida");
      return;
    }

    await fetchHorarios();
    
    if (userRole.toUpperCase() !== "TERAPEUTA") {
      setTerapeutaSeleccionado("");
    }
  };'''
content = content.replace(old_salida, new_salida)

# 6. Update buttons
old_buttons = '''          <div className="flex gap-2 w-full">
            <button 
              onClick={registrarEntrada}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Entrada
            </button>
            <button 
              onClick={registrarSalida}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Salida
            </button>
          </div>'''

new_buttons = '''          <div className="flex gap-2 w-full">
            <button 
              onClick={handleEntrada}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Entrada
            </button>
            <button 
              onClick={handleSalida}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95"
            >
              Salida
            </button>
          </div>'''
content = content.replace(old_buttons, new_buttons)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
