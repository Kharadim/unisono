"""Reset the Unisono AppData DB so WelcomeModal shows on next start."""
import os

db_path = os.path.join(os.environ['APPDATA'], 'com.unisono.desktop', 'unisono.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Deleted: {db_path}")
    print("Next app start will show the WelcomeModal.")
else:
    print(f"DB not found: {db_path}")
