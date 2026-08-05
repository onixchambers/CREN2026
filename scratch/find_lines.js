const fs = require('fs');
const lines = fs.readFileSync('src/app/dashboard/agenda/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
    if (l.includes('const handleOpenModal = (tName?: string, hStr?: string) => {')) console.log('handleOpenModal:', i + 1);
    if (l.includes('const draggedData = e.dataTransfer.getData(\'application/json\');')) console.log('draggedData json:', i + 1);
    if (l.includes('e.dataTransfer.setData("citaId", cita.id);')) console.log('setData citaId:', i + 1);
});
