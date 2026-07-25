import os

path = 'prisma/schema.prisma'
with open(path, 'a', encoding='utf-8') as f:
    f.write("""
model Horario {
  id          String   @id @default(cuid())
  terapeuta   String
  fecha       String   // Format YYYY-MM-DD
  horaEntrada String
  horaSalida  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
""")
