import sqlite3

conn = sqlite3.connect("assets/bible.db")
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", [t[0] for t in tables])

# Check ROM 8
cursor.execute("SELECT COUNT(*) FROM patristic_refs WHERE book='ROM' AND chapter=8")
count = cursor.fetchone()[0]
print(f"ROM 8 Count: {count}")

# Sample data
cursor.execute("SELECT book, chapter, verse, author FROM patristic_refs WHERE book='ROM' AND chapter=8 LIMIT 5")
sample = cursor.fetchall()
print("Sample:", sample)

conn.close()
