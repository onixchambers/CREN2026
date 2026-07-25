const usuarios = [
  { rol: "Admin", name: "administrador" },
  { rol: "Terapeuta", name: "karla" },
  { rol: "Terapeuta", name: "elizabeth" },
  { rol: "Admin", name: "admin@cren.com" }
];

const sorted = [...usuarios].sort((a, b) => {
  if (a.rol === "Admin" && b.rol !== "Admin") return -1;
  if (a.rol !== "Admin" && b.rol === "Admin") return 1;
  return 0;
});

console.log(sorted.map(u => u.name));
