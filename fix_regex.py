import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re

# We want to replace `)} \n </tbody>` with `); \n })()} \n </tbody>`
c = re.sub(r'\s*}\s*</tbody', '\n                );\n              })()}\n            </tbody', c)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Regex replaced")
