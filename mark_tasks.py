import os
path = 'C:/Users/onixc/.gemini/antigravity/brain/d0bd6e2c-a541-4425-b3e7-3f4167b9d0da/task.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('[ ]', '[x]')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
