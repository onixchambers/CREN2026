import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """                )
                  );
                })()}
              </tbody>"""

repl = """                );
              })()}
              </tbody>"""

if target in c:
    c = c.replace(target, repl)
    print("Fixed final parenthesis issue")
else:
    print("Target not found")
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
