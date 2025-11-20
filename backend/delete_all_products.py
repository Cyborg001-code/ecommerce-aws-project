from config.database import get_db_connection
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

# S3 Configuration
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
IMAGES_BUCKET = os.getenv('S3_IMAGES_BUCKET', 'ecommerce-images-ankush-2024')

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

def delete_s3_images():
    """Delete all product images from S3 bucket"""
    
    try:
        print("\n🗑️  Deleting images from S3...")
        
        # List all objects in products/ folder
        response = s3_client.list_objects_v2(
            Bucket=IMAGES_BUCKET,
            Prefix='products/'
        )
        
        if 'Contents' not in response:
            print("   No images found in S3")
            return True
        
        # Delete all objects
        objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
        
        if objects_to_delete:
            s3_client.delete_objects(
                Bucket=IMAGES_BUCKET,
                Delete={'Objects': objects_to_delete}
            )
            
            print(f"   ✅ Deleted {len(objects_to_delete)} images from S3")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error deleting S3 images: {e}")
        return False


def delete_database_data():
    """Delete all products, orders, cart items, and order items from database"""
    
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    cursor = conn.cursor()
    
    try:
        print("\n🗑️  Deleting data from database...")
        
        # Delete in correct order (respecting foreign keys)
        
        # 1. Delete order items first
        cursor.execute("DELETE FROM order_items")
        deleted_order_items = cursor.rowcount
        print(f"   ✅ Deleted {deleted_order_items} order items")
        
        # 2. Delete orders
        cursor.execute("DELETE FROM orders")
        deleted_orders = cursor.rowcount
        print(f"   ✅ Deleted {deleted_orders} orders")
        
        # 3. Delete cart items
        cursor.execute("DELETE FROM cart")
        deleted_cart = cursor.rowcount
        print(f"   ✅ Deleted {deleted_cart} cart items")
        
        # 4. Finally delete products
        cursor.execute("DELETE FROM products")
        deleted_products = cursor.rowcount
        print(f"   ✅ Deleted {deleted_products} products")
        
        # Reset ID sequences
        cursor.execute("ALTER SEQUENCE products_id_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE orders_id_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE order_items_id_seq RESTART WITH 1")
        cursor.execute("ALTER SEQUENCE cart_id_seq RESTART WITH 1")
        print("   ✅ Reset all ID counters")
        
        conn.commit()
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error deleting database data: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()


def delete_all_data():
    """Delete everything: database data + S3 images"""
    
    print("\n" + "="*60)
    print("   COMPLETE DATA DELETION")
    print("="*60)
    
    # Delete S3 images first
    s3_success = delete_s3_images()
    
    # Delete database data
    db_success = delete_database_data()
    
    if s3_success and db_success:
        print("\n" + "="*60)
        print("🎉 ALL DATA DELETED SUCCESSFULLY!")
        print("="*60)
        print("\n✅ Database is clean")
        print("✅ S3 images bucket is clean")
        print("✅ Ready for fresh products")
        print("\n")
        return True
    else:
        print("\n⚠️  Some deletions failed. Check errors above.")
        return False


if __name__ == '__main__':
    print("\n" + "="*60)
    print("⚠️  DANGER ZONE - COMPLETE DATA WIPE ⚠️")
    print("="*60)
    print("\nThis will PERMANENTLY delete:")
    print("  ❌ All products from database")
    print("  ❌ All orders from database")
    print("  ❌ All order items from database")
    print("  ❌ All cart items from database")
    print("  ❌ All product images from S3 bucket")
    print("\n" + "="*60)
    print("⚠️  THIS ACTION CANNOT BE UNDONE!")
    print("="*60 + "\n")
    
    confirmation = input("Type 'DELETE EVERYTHING' to confirm: ")
    
    if confirmation == 'DELETE EVERYTHING':
        delete_all_data()
    else:
        print("\n❌ Deletion cancelled - nothing was deleted")