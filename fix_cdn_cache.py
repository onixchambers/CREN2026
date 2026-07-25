import os
import re

layout_path = 'src/app/dashboard/layout.tsx'
with open(layout_path, 'r', encoding='utf-8') as f:
    layout_content = f.read()

# Replace href={tab.path} with href={tab.path + "?t=" + Date.now()}
layout_content = layout_content.replace('href={tab.path}', 'href={`${tab.path}?t=${Date.now()}`}')

with open(layout_path, 'w', encoding='utf-8') as f:
    f.write(layout_content)

login_path = 'src/app/login/page.tsx'
with open(login_path, 'r', encoding='utf-8') as f:
    login_content = f.read()

login_content = login_content.replace('window.location.href = "/dashboard";', 'window.location.href = `/dashboard?t=${Date.now()}`;')

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_content)
