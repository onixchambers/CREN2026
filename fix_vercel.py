import os
import json

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    schema = f.read()

old_ds = '''datasource db {
  provider = "postgresql"
}'''

new_ds = '''datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:5432/postgres"
}'''
schema = schema.replace(old_ds, new_ds)
with open(path, 'w', encoding='utf-8') as f:
    f.write(schema)

pkg_path = 'package.json'
with open(pkg_path, 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['scripts']['build'] = "prisma db push --accept-data-loss && prisma generate && next build"
with open(pkg_path, 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)

