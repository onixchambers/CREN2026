import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Remove the invalid `})()}`
c = c.replace('                </tr>\n              );\n            })()}\n            </tbody>', '                </tr>\n              )}\n            </tbody>')
# Also handle if it was left in a different state by fix_syntax3
c = c.replace('              )\n            })()}\n            </tbody>', '              )}\n            </tbody>')
c = c.replace('              );\n            })()}\n            </tbody>', '              )}\n            </tbody>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Cleaned up trailing characters")
