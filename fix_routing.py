import os

layout_path = 'src/app/dashboard/layout.tsx'
with open(layout_path, 'r', encoding='utf-8') as f:
    layout_content = f.read()

layout_content = layout_content.replace('<Link', '<a')
layout_content = layout_content.replace('</Link>', '</a>')

with open(layout_path, 'w', encoding='utf-8') as f:
    f.write(layout_content)

login_path = 'src/app/login/page.tsx'
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

login_content = login_content.replace('router.push("/dashboard");', 'window.location.href = "/dashboard";')

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)
