from config.database import get_db_connection

def add_admin_column():
    """Add is_admin column to users table"""
    
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    try:
        # Add is_admin column
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
        """)
        
        conn.commit()
        print("✅ Admin column added successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    add_admin_column()