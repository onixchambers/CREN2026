import os

path = 'src/app/dashboard/asistencia/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

import re

# We will match the fallback block exactly.
pattern = re.compile(r'\)\)\s*:\s*\(\s*<tr>\s*<td.*?Sin registros\.\s*</td>\s*</tr>\s*\).*?</tbody>', re.DOTALL)
replacement = """) : (
                  <tr>
                    <td colSpan={16} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Sin registros.
                    </td>
                  </tr>
                );
              })()}
            </tbody>"""

if pattern.search(c):
    c = pattern.sub(replacement, c)
    print("Regex replaced successfully")
else:
    print("Pattern not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
