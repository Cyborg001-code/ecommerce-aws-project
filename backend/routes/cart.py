from flask import Blueprint, jsonify, request
from config.database import get_db_connection

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    """Get user's cart (for now, use a test user_id)"""
    user_id = request.args.get('user_id', 'test_user')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_key, p.stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        
        items = cursor.fetchall()
        
        # Calculate total
        total = sum(float(item['price']) * item['quantity'] for item in items)
        
        # Add image URLs
        cloudfront_domain = "https://your-cloudfront-domain.net"
        for item in items:
            item['imageUrl'] = f"{cloudfront_domain}/images/{item['image_key']}"
        
        return jsonify({
            'items': items,
            'total': total,
            'item_count': len(items)
        }), 200
        
    except Exception as e:
        print(f"Error fetching cart: {e}")
        return jsonify({'error': 'Failed to fetch cart'}), 500
        
    finally:
        cursor.close()
        conn.close()


@cart_bp.route('/cart', methods=['POST'])
def add_to_cart():
    """Add item to cart"""
    data = request.json
    user_id = data.get('user_id', 'test_user')
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({'error': 'Product ID required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Check if item already in cart
        cursor.execute("""
            SELECT id, quantity FROM cart 
            WHERE user_id = %s AND product_id = %s
        """, (user_id, product_id))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update quantity
            new_quantity = existing['quantity'] + quantity
            cursor.execute("""
                UPDATE cart SET quantity = %s WHERE id = %s
            """, (new_quantity, existing['id']))
        else:
            # Insert new item
            cursor.execute("""
                INSERT INTO cart (user_id, product_id, quantity)
                VALUES (%s, %s, %s)
            """, (user_id, product_id, quantity))
        
        conn.commit()
        return jsonify({'message': 'Added to cart successfully'}), 200
        
    except Exception as e:
        print(f"Error adding to cart: {e}")
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