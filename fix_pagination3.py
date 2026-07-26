import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """                  </tr>
                )}
              </tbody>"""

repl = """                  </tr>
                );
              })()}
              </tbody>"""

if target in c:
    c = c.replace(target, repl)
    print("Fixed target2")
else:
    print("target2 not found")
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
