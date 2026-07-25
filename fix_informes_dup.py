import os

path = 'src/app/dashboard/informes/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const [files, setFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;'''

replacement = '''  const [files, setFiles] = useState<File[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;'''

content = content.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
