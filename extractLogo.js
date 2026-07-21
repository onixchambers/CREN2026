const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', '_old', 'CREN43_ACTUALIZADO.html');
const outPath = path.join(__dirname, 'public', 'logo.jpg');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const match = htmlContent.match(/src="data:image\/jpeg;base64,([^"]+)"/);

if (match && match[1]) {
  const base64Data = match[1];
  fs.writeFileSync(outPath, base64Data, 'base64');
  console.log('Logo guardado exitosamente en public/logo.jpg');
} else {
  console.log('No se encontró el logo base64 en el HTML');
}
