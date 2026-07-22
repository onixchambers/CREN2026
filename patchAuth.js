const fs = require("fs");
const path = "src/lib/auth.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /credentials: \{\s*email: \{ label: "Correo Electrónico", type: "email", placeholder: "usuario@ejemplo\.com" \},\s*password: \{ label: "Contraseña", type: "password" \},\s*\},/,
  `credentials: {
        username: { label: "Usuario", type: "text", placeholder: "Nombre de usuario" },
        password: { label: "Contraseña", type: "password" },
      },`
);

content = content.replace(
  /if \(!credentials\?\.email \|\| !credentials\?\.password\) \{\s*return null;\s*\}/,
  `if (!credentials?.username || !credentials?.password) {
          return null;
        }`
);

content = content.replace(
  /if \(credentials\.email === "admin@cren\.com" && credentials\.password === "admin123"\) \{[\s\S]*?return null;\s*\}/m,
  `const user = await prisma.user.findFirst({
          where: { name: credentials.username }
        });

        if (!user || user.password !== credentials.password) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || "",
          role: user.role,
        };`
);

fs.writeFileSync(path, content);
console.log("Auth patched");
