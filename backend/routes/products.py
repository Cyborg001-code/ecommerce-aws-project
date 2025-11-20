from flask import Blueprint, jsonify, request
from config.database import get_db_connection
import os

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
def get_products():
    """Get all products with optional filters"""
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Get query parameters
        category = request.args.get('category')
        search = request.args.get('search')
        min_price = request.args.get('minPrice')
        max_price = request.args.get('maxPrice')
        
        # Build query
        query = "SELECT * FROM products WHERE is_active = true"
        params = []
        
        if category:
            query += " AND category = %s"
            params.append(category)
        
        if search:
            query += " AND (name ILIKE %s OR description ILIKE %s)"
            params.append(f'%{search}%')
            params.append(f'%{search}%')
        
        if min_price:
            query += " AND price >= %s"
            params.append(float(min_price))
        
        if max_price:
            query += " AND price <= %s"
            params.append(float(max_price))
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        products = cursor.fetchall()
        
        # Add image URLs
        bucket_name = os.getenv('S3_IMAGES_BUCKET', 'ecommerce-images-ankush-2024')
        region = os.getenv('AWS_REGION', 'us-east-1')
        
        for product in products:
            if product.get('image_key'):
                product['imageUrl'] = f"https://{bucket_name}.s3.{region}.amazonaws.com/{product['image_key']}"
            else:
                product['imageUrl'] = f"https://via.placeholder.com/300x200?text={product['name']}"
        
        return jsonify(products), 200
        
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({'error': 'Failed to fetch products'}), 500
        
    finally:
        cursor.close()
        conn.close()


@products_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM products WHERE id = %s AND is_active = true", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Add image URL
        bucket_name = os.getenv('S3_IMAGES_BUCKET', 'ecommerce-images-ankush-2024')
        region = os.getenv('AWS_REGION', 'us-east-1')
        
        if product.get('image_key'):
            product['imageUrl'] = f"https://{bucket_name}.s3.{region}.amazonaws.com/{product['image_key']}"
        else:
            product['imageUrl'] = f"https://via.placeholder.com/300x200?text={product['name']}"
        
        return jsonify(product), 200
        
    except Exception as e:
        print(f"Error fetching product: {e}")
        return jsonify({'error': 'Failed to fetch product'}), 500
        
    finally:
        cursor.close()
        conn.close()