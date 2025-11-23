from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from datetime import datetime
import os

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    """Create new order from cart"""
    data = request.json
    user_id = data.get('user_id', 'test_user')
    shipping_address = data.get('shipping_address', '')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Get cart items
        cursor.execute("""
            SELECT c.product_id, c.quantity, p.price, p.stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        
        cart_items = cursor.fetchall()
        
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Calculate total
        total_amount = sum(float(item['price']) * item['quantity'] for item in cart_items)
        
        # Check stock availability
        for item in cart_items:
            if item['quantity'] > item['stock']:
                return jsonify({'error': f'Insufficient stock for product {item["product_id"]}'}), 400
        
        # Create order
        cursor.execute("""
            INSERT INTO orders (user_id, total_amount, shipping_address, status)
            VALUES (%s, %s, %s, 'pending')
            RETURNING id
        """, (user_id, total_amount, shipping_address))
        
        order_id = cursor.fetchone()['id']
        
        # Create order items and update stock
        for item in cart_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item['product_id'], item['quantity'], item['price']))
            
            # Update product stock
            cursor.execute("""
                UPDATE products SET stock = stock - %s WHERE id = %s
            """, (item['quantity'], item['product_id']))
        
        # Clear cart
        cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
        
        conn.commit()
        
        return jsonify({
            'message': 'Order placed successfully',
            'order_id': order_id,
            'total': total_amount
        }), 200
        
    except Exception as e:
        print(f"Error creating order: {e}")
        conn.rollback()
        return jsonify({'error': 'Failed to create order'}), 500
        
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('/orders', methods=['GET'])
def get_orders():
    """Get user's orders"""
    user_id = request.args.get('user_id', 'test_user')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM orders 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (user_id,))
        
        orders = cursor.fetchall()
        
        return jsonify(orders), 200
        
    except Exception as e:
        print(f"Error fetching orders: {e}")
        return jsonify({'error': 'Failed to fetch orders'}), 500
        
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get order details with items"""
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Get order
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Get order items
        cursor.execute("""
            SELECT oi.*, p.name, p.image_key
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (order_id,))
        
        items = cursor.fetchall()
        
        # Add image URLs - FIXED
        bucket_name = os.getenv('S3_IMAGES_BUCKET', 'ecommerce-images-ankush-2025')
        region = os.getenv('AWS_REGION', 'us-east-1')
        
        for item in items:
            if item.get('image_key'):
                item['imageUrl'] = f"https://{bucket_name}.s3.{region}.amazonaws.com/{item['image_key']}"
            else:
                item['imageUrl'] = f"https://via.placeholder.com/100?text={item['name']}"
        
        order['items'] = items
        
        return jsonify(order), 200
        
    except Exception as e:
        print(f"Error fetching order: {e}")
        return jsonify({'error': 'Failed to fetch order'}), 500
        
    finally:
        cursor.close()
        conn.close()