from config.database import get_db_connection

def create_users_table():
    """Create users table"""
    
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("✅ Users table created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating users table: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    create_users_table()