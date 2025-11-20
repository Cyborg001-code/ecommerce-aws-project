from flask import Blueprint, jsonify, request
from config.database import get_db_connection
import boto3
import os
from werkzeug.utils import secure_filename

admin_bp = Blueprint('admin', __name__)

# S3 client (for image upload)
s3_client = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'us-east-1'))
BUCKET_NAME = 'ecommerce-images-ankush-2024'  # Replace with your bucket name

@admin_bp.route('/admin/upload-image', methods=['POST'])
def upload_image():
    """Upload product image to S3"""
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    image_key = request.form.get('image_key')
    
    if not image_key:
        return jsonify({'error': 'Image key required'}), 400
    
    try:
        # Upload to S3
        s3_client.upload_fileobj(
            file,
            BUCKET_NAME,
            image_key,
            ExtraArgs={'ContentType': file.content_type, 'ACL': 'public-read'}
        )
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_key': image_key
        }), 200
        
    except Exception as e:
        print(f"Error uploading image: {e}")
        return jsonify({'error': 'Failed to upload image'}), 500


@admin_bp.route('/admin/products', methods=['POST'])
def create_product():
    """Create new product"""
    
    data = request.json
    
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
        
        return jsonify({'message': 'Product created', 'id': product_id}), 200
        
    except Exception as e:
        print(f"Error creating product: {e}")
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
        
        return jsonify({'message': 'Product updated'}), 200
        
    except Exception as e:
        print(f"Error updating product: {e}")
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
        cursor.execute("UPDATE products SET is_active = false WHERE id = %s", (product_id,))
        conn.commit()
        
        return jsonify({'message': 'Product deleted'}), 200
        
    except Exception as e:
        print(f"Error deleting product: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to delete product'}), 500
        
    finally:
        cursor.close()
        conn.close()