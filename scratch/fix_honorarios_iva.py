import os
import json
import psycopg2

DATABASE_URL = "postgresql://postgres.rquxzsmogmubtnovuhxu:Pj12676354%40.@aws-0-ca-central-1.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Find users
cur.execute("SELECT id, name, role FROM \"User\";")
users = cur.fetchall()
print("Users in DB:", users)

sheribeth_id = None
for u in users:
    if "sheribeth" in u[1].lower():
        sheribeth_id = u[0]
        print("Found Sheribeth ID:", sheribeth_id, "| Name:", u[1])

# Inspect sessions around 2026-07-27 or BRATHWAITE
cur.execute("SELECT s.id, s.\"date\", s.\"therapistId\", s.\"patientId\", s.notes, p.name, t.name FROM \"Session\" s LEFT JOIN \"Patient\" p ON s.\"patientId\" = p.id LEFT JOIN \"User\" t ON s.\"therapistId\" = t.id;")
sessions = cur.fetchall()

print(f"\n--- ALL SESSIONS ({len(sessions)}) IN DB ---")
for s in sessions:
    notes_str = s[4] or ""
    print(f"\nSession ID: {s[0]} | Date: {s[1]} | Therapist: {s[6]} (ID: {s[2]}) | Patient: {s[5]}")
    print(f"Notes: {notes_str[:150]}")
    
    # If notes or patient name contain Sheribeth or BRATHWAITE
    if "sheribeth" in notes_str.lower() or "brathwaite" in notes_str.lower() or "brathwaite" in (s[5] or "").lower():
        if sheribeth_id and s[2] != sheribeth_id:
            print(f"--> Updating session {s[0]} therapistId to {sheribeth_id} (Sheribeth)")
            cur.execute("UPDATE \"Session\" SET \"therapistId\" = %s WHERE id = %s;", (sheribeth_id, s[0]))
            
        # Parse notes and ensure solicitaFactura, iva, subtotal, total are set properly
        try:
            extra = json.loads(notes_str)
            extra["solicitaFactura"] = True
            extra["factura"] = "Sí"
            extra["fact"] = "Sí"
            if "total" not in extra or not extra["total"]:
                extra["total"] = 400.0
            if "subtotal" not in extra or not extra["subtotal"]:
                extra["subtotal"] = 336.0
            if "iva" not in extra or not extra["iva"] or extra["iva"] == 0:
                extra["iva"] = 64.0
            updated_notes = json.dumps(extra)
            cur.execute("UPDATE \"Session\" SET notes = %s WHERE id = %s;", (updated_notes, s[0]))
            print(f"--> Notes updated for session {s[0]}: solicitaFactura=True, iva=64.0, total=400.0")
        except Exception as e:
            print("Error parsing notes:", e)

conn.commit()
cur.close()
conn.close()
print("\nDatabase session fix completed!")
