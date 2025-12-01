import sqlite3

def fix_db():
    print("Checking database schema...")
    try:
        conn = sqlite3.connect('e:/Online Food Ordering App/ecommerce.db')
        cursor = conn.cursor()
        
        # Check columns
        cursor.execute("PRAGMA table_info(products)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'is_available' not in columns:
            print("Adding 'is_available' column...")
            cursor.execute('ALTER TABLE products ADD COLUMN is_available BOOLEAN DEFAULT 1')
            conn.commit()
            print("Column added successfully.")
        else:
            print("'is_available' column already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_db()
