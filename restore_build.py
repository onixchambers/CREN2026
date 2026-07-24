import os

path = 'package.json'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"build": "prisma generate && next build",', '"build": "prisma generate && npx prisma db push --accept-data-loss && next build",')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
