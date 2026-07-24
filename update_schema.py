import os

file_path = 'prisma/schema.prisma'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

orig = '''model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("USER") // e.g., ADMIN, THERAPIST, USER
  password      String?
  createdAt     DateTime  @default(now())
}'''

new = '''model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("USER") // e.g., ADMIN, THERAPIST, USER
  password      String?
  especialidad  String?
  createdAt     DateTime  @default(now())
}'''

content = content.replace(orig, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
