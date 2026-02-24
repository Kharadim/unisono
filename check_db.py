import sqlite3, os

db_path = os.path.join(os.environ['APPDATA'], 'com.unisono.desktop', 'unisono.db')
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row

print("=== Settings ===")
for row in conn.execute("SELECT key, value FROM settings").fetchall():
    k, v = row['key'], row['value']
    if k == 'auth_password_hash':
        v = v[:20] + '...' if v else ''
    if k == 'auth_session_token':
        v = v[:10] + '...' if v else ''
    print(f"  {k} = {v}")

emp = conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0]
print(f"\n=== Employees: {emp} ===")

conn.close()
