"use client";
import { useState, useEffect } from "react";

export default function PreregistrosPage() {
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `//`;
    return dateStr;
  };
  const [formData, setFormData] = useState({
    nombre: "",
    fechaNacimiento: "",
    sexo: "",
    fechaIngreso: "2026-07-21",
    estatus: "Activo",
    origen: "Google",
    medicoTratante: "",
    escuela: "",
    
    madreNombre: "",
    padreNombre: "",
    otrosNombre: "",
    madreContacto: "",
    padreContacto: "",
    otrosContacto: "",
    principalMadre: false,
    principalPadre: false,
    principalOtros: false,
    correoPrincipal: "",
    
    alergias: false,
    crisis: false,
    convulsiones: false,
    sensibilidad: false,
    riesgoFuga: false,
    noSepara: false,
    otrasAlertas: false,
    
    reglamentoFirmado: false,
    consentimientoFirmado: false,
    
    observacionesAdmin: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

