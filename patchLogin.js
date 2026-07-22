const fs = require("fs");
const path = "src/app/login/page.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const \[email, setEmail\] = useState\(""\);/,
  `const [username, setUsername] = useState("");`
);

content = content.replace(
  /email,/g,
  `username,`
);

content = content.replace(
  /Correo Electrónico/,
  `Usuario`
);

content = content.replace(
  /type="email"/,
  `type="text"`
);

content = content.replace(
  /value=\{username\}/,
  `value={username}`
);

content = content.replace(
  /onChange=\{\(e\) => setEmail\(e\.target\.value\)\}/,
  `onChange={(e) => setUsername(e.target.value)}`
);

content = content.replace(
  /placeholder="usuario@ejemplo\.com"/,
  `placeholder="Nombre de usuario"`
);

fs.writeFileSync(path, content);
console.log("Login patched");
