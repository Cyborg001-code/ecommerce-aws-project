from flask import Blueprint, jsonify, request
from config.database import get_db_connection
import boto3
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

admin_bp = Blueprint('admin', __name__)

# S3 Configuration
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
IMAGES_BUCKET = os.getenv('S3_IMAGES_BUCKET', 'ecommerce-images-ankush-2025')

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)


@admin_bp.route('/admin/upload-image', methods=['POST'])
def upload_image():
    """Upload product image to S3 images bucket"""
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    image_key = request.form.get('image_key')
    
    if not image_key:
        return jsonify({'error': 'Image key required'}), 400
    
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    # Validate file type
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP'}), 400
    
    try:
        # Upload to S3 images bucket
        s3_client.upload_fileobj(
            file,
            IMAGES_BUCKET,
            image_key,
            ExtraArgs={
                'ContentType': file.content_type,
                'ACL': 'public-read'  # Make image publicly readable
            }
        )
        
        # Generate public URL
        image_url = f"https://{IMAGES_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{image_key}"
        
        print(f"✅ Image uploaded successfully to {IMAGES_BUCKET}/{image_key}")
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_key': image_key,
            'image_url': image_url
        }), 200
        
    except Exception as e:
        print(f"❌ Error uploading image to S3: {e}")
        return jsonify({'error': f'Failed to upload image: {str(e)}'}), 500


@admin_bp.route('/admin/products', methods=['POST'])
def create_product():
    """Create new product"""
    
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'description', 'price', 'category', 'stock', 'image_key']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO products (name, description, price, category, stock, image_key, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, true)
            RETURNING id
        """, (
            data['name'],
            data['description'],
            data['price'],
            data['category'],
            data['stock'],
            data['image_key']
        ))
        
        product_id = cursor.fetchone()['id']
        conn.commit()
        
        print(f"✅ Product created with ID: {product_id}")
        
        return jsonify({
            'message': 'Product created successfully',
            'id': product_id
        }), 200
        
    except Exception as e:
        print(f"❌ Error creating product: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to create product'}), 500
        
    finally:
        cursor.close()
        conn.close()


@admin_bp.route('/admin/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Update product (mainly stock)"""
    
    data = request.json
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Build update query dynamically
        update_fields = []
        values = []
        
        if 'stock' in data:
            update_fields.append('stock = %s')
            values.append(data['stock'])
        
        if 'price' in data:
            update_fields.append('price = %s')
            values.append(data['price'])
        
        if 'name' in data:
            update_fields.append('name = %s')
            values.append(data['name'])
        
        if 'description' in data:
            update_fields.append('description = %s')
            values.append(data['description'])
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        values.append(product_id)
        
        query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(query, values)
        
        conn.commit()
        
        return jsonify({'message': 'Product updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error updating product: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to update product'}), 500
        
    finally:
        cursor.close()
        conn.close()


@admin_bp.route('/admin/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete product (soft delete - set is_active = false)"""
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE products 
            SET is_active = false 
            WHERE id = %s
        """, (product_id,))
        
        conn.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error deleting product: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to delete product'}), 500
        
    finally:
        cursor.close()
        conn.close()