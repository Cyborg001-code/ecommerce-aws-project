from config.database import get_db_connection
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_admin():
    """Create admin account"""
    
    # Admin credentials (CHANGE THESE!)
    admin_name = "Admin"
    admin_email = "admin@mystore.com"
    admin_password = "Admin@123"  # Change this to a strong password
    
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    try:
        # Check if admin already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        existing = cursor.fetchone()
        
        if existing:
            print("⚠️ Admin account already exists!")
            
            # Update to make admin
            cursor.execute("""
                UPDATE users 
                SET is_admin = true 
                WHERE email = %s
            """, (admin_email,))
            
            conn.commit()
            print("✅ Existing account set as admin")
            
        else:
            # Create new admin account
            hashed_password = hash_password(admin_password)
            
            cursor.execute("""
                INSERT INTO users (name, email, password, is_admin, created_at)
                VALUES (%s, %s, %s, true, NOW())
                RETURNING id
            """, (admin_name, admin_email, hashed_password))
            
            admin_id = cursor.fetchone()['id']
            conn.commit()
            
            print("✅ Admin account created successfully!")
            print(f"   Email: {admin_email}")
            print(f"   Password: {admin_password}")
            print(f"   ID: {admin_id}")
            print("\n⚠️ IMPORTANT: Change this password after first login!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    create_admin()