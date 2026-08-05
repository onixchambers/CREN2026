const fs = require('fs');
const file = 'src/app/dashboard/agenda/page.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('const handleEditCitaModal')) {
    const hookInsertion = `  const handleOpenModal = (tName?: string, hStr?: string) => {`;
    const newHook = `
  const handleEditCitaModal = (cita: any) => {
    setSelectedCitaForStatus(cita);
    setIsStatusModalOpen(true);
  };
  const handleOpenModal = (tName?: string, hStr?: string) => {`;
    code = code.replace(hookInsertion, newHook);
}

const onDropCodeToReplace = `onDrop={(e) => {
                              e.preventDefault();
                              const draggedData = e.dataTransfer.getData('application/json');
                              if (draggedData) {
                                try {
                                  const payload = JSON.parse(draggedData);
                                  setPendingMoveCita({
                                    citaId: payload.id,
                                    newHora: hora,
                                    newTerapeuta: userName,
                                    newFecha: d.dateStr
                                  });
                                  setIsConfirmMoveModalOpen(true);
                                } catch(err){}
                              }
                            }}`;

const newOnDropCode = `onDrop={(e) => {
                              e.preventDefault();
                              const draggedData = e.dataTransfer.getData('citaId');
                              if (draggedData) {
                                  setPendingMoveCita({
                                    citaId: draggedData,
                                    newHora: hora,
                                    newTerapeuta: userName,
                                    newFecha: d.dateStr
                                  });
                                  setIsConfirmMoveModalOpen(true);
                              }
                            }}`;
                            
code = code.replace(onDropCodeToReplace, newOnDropCode);

const onDropCodeToReplace2 = `onDrop={(e) => {
                            e.preventDefault();
                            const draggedData = e.dataTransfer.getData('application/json');
                            if (draggedData) {
                              try {
                                const payload = JSON.parse(draggedData);
                                setPendingMoveCita({
                                  citaId: payload.id,
                                  newHora: hora,
                                  newTerapeuta: t,
                                  newFecha: fechaSeleccionada
                                });
                                setIsConfirmMoveModalOpen(true);
                              } catch(err){}
                            }
                          }}`;
                          
const newOnDropCode2 = `onDrop={(e) => {
                            e.preventDefault();
                            const draggedData = e.dataTransfer.getData('citaId');
                            if (draggedData) {
                                setPendingMoveCita({
                                  citaId: draggedData,
                                  newHora: hora,
                                  newTerapeuta: t,
                                  newFecha: fechaSeleccionada
                                });
                                setIsConfirmMoveModalOpen(true);
                            }
                          }}`;

code = code.replace(onDropCodeToReplace2, newOnDropCode2);

fs.writeFileSync(file, code);
