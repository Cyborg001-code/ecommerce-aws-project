from config.database import get_db_connection

def seed_products():
    """Add sample products to database"""
    
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    # Sample products
    products = [
        ('Dell XPS 15 Laptop', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'Electronics', 10, 'products/laptop-dell-xps.jpg'),
        ('iPhone 15 Pro', 'Latest iPhone with A17 Pro chip and 256GB storage', 999.99, 'Electronics', 25, 'products/iphone-15-pro.jpg'),
        ('Sony WH-1000XM5', 'Premium noise-cancelling wireless headphones', 399.99, 'Audio', 15, 'products/sony-headphones.jpg'),
        ('Samsung 4K Smart TV', '55-inch 4K UHD Smart TV with HDR', 699.99, 'Electronics', 8, 'products/samsung-tv.jpg'),
        ('Apple Watch Series 9', 'Smartwatch with fitness tracking and health monitoring', 429.99, 'Wearables', 20, 'products/apple-watch.jpg'),
        ('Logitech MX Master 3', 'Advanced wireless mouse for productivity', 99.99, 'Accessories', 30, 'products/logitech-mouse.jpg'),
        ('Canon EOS R6', 'Full-frame mirrorless camera with 20MP sensor', 2499.99, 'Cameras', 5, 'products/canon-camera.jpg'),
        ('Nike Air Max 270', 'Comfortable running shoes with Air cushioning', 149.99, 'Fashion', 50, 'products/nike-shoes.jpg'),
    ]
    
    try:
        for product in products:
            cursor.execute("""
                INSERT INTO products (name, description, price, category, stock, image_key)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, product)
        
        conn.commit()
        print(f"✅ Added {len(products)} sample products to database!")
        return True
        
    except Exception as e:
        print(f"❌ Error adding products: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    seed_products()
