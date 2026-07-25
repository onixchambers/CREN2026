import os
import json

path = 'package.json'
with open(path, 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['scripts']['build'] = 'DIRECT_URL="postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:5432/postgres" prisma db push --accept-data-loss && prisma generate && next build'

with open(path, 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)
