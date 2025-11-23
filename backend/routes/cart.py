from flask import Blueprint, jsonify, request
from config.database import get_db_connection
import os

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    """Get user's cart"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_key, p.stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s AND p.is_active = true
        """, (user_id,))
        
        items = cursor.fetchall()
        
        # Calculate total
        total = sum(float(item['price']) * item['quantity'] for item in items)
        
        # Add image URLs
        bucket_name = os.getenv('S3_IMAGES_BUCKET', 'ecommerce-images-ankush-2025')
        region = os.getenv('AWS_REGION', 'us-east-1')
        
        for item in items:
            if item.get('image_key'):
                item['imageUrl'] = f"https://{bucket_name}.s3.{region}.amazonaws.com/{item['image_key']}"
            else:
                item['imageUrl'] = f"https://via.placeholder.com/100?text={item['name']}"
        
        return jsonify({
            'items': items,
            'total': total,
            'item_count': len(items)
        }), 200
        
    except Exception as e:
        print(f"Error fetching cart: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch cart'}), 500
        
    finally:
        cursor.close()
        conn.close()


@cart_bp.route('/cart', methods=['POST'])
def add_to_cart():
    """Add item to cart"""
    data = request.json
    
    # Get user_id from request
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    print(f"Add to cart request: user_id={user_id}, product_id={product_id}, quantity={quantity}")
    
    # Validate inputs
    if not user_id:
        return jsonify({'error': 'User ID required. Please login first.'}), 400
    
    if not product_id:
        return jsonify({'error': 'Product ID required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # First, check if product exists and has stock
        cursor.execute("""
            SELECT id, name, stock FROM products 
            WHERE id = %s AND is_active = true
        """, (product_id,))
        
        product = cursor.fetchone()
        
        if not product:
            return jsonify({'error': 'Product not found or inactive'}), 404
        
        if product['stock'] < quantity:
            return jsonify({'error': f'Insufficient stock. Only {product["stock"]} available.'}), 400
        
        # Check if item already in cart
        cursor.execute("""
            SELECT id, quantity FROM cart 
            WHERE user_id = %s AND product_id = %s
        """, (user_id, product_id))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update quantity
            new_quantity = existing['quantity'] + quantity
            
            # Check stock again
            if new_quantity > product['stock']:
                return jsonify({'error': f'Cannot add more. Only {product["stock"]} available.'}), 400
            
            cursor.execute("""
                UPDATE cart SET quantity = %s WHERE id = %s
            """, (new_quantity, existing['id']))
            print(f"Updated cart item {existing['id']} to quantity {new_quantity}")
        else:
            # Insert new item
            cursor.execute("""
                INSERT INTO cart (user_id, product_id, quantity)
                VALUES (%s, %s, %s)
            """, (user_id, product_id, quantity))
            print(f"Added new cart item: product {product_id}, quantity {quantity}")
        
        conn.commit()
        return jsonify({'message': 'Added to cart successfully'}), 200
        
    except Exception as e:
        print(f"Error adding to cart: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return jsonify({'error': 'Failed to add to cart'}), 500
        
    finally:
        cursor.close()
        conn.close()


@cart_bp.route('/cart/<int:cart_id>', methods=['PUT'])
def update_cart_item(cart_id):
    """Update cart item quantity"""
    data = request.json
    quantity = data.get('quantity')
    
    if not quantity or quantity < 1:
        return jsonify({'error': 'Valid quantity required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE cart SET quantity = %s WHERE id = %s
        """, (quantity, cart_id))
        
        conn.commit()
        return jsonify({'message': 'Cart updated successfully'}), 200
        
    except Exception as e:
        print(f"Error updating cart: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to update cart'}), 500
        
    finally:
        cursor.close()
        conn.close()


@cart_bp.route('/cart/<int:cart_id>', methods=['DELETE'])
def remove_from_cart(cart_id):
    """Remove item from cart"""
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM cart WHERE id = %s", (cart_id,))
        conn.commit()
        return jsonify({'message': 'Item removed from cart'}), 200
        
    except Exception as e:
        print(f"Error removing from cart: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to remove item'}), 500
        
    finally:
        cursor.close()
        conn.close()