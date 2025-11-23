from flask import Blueprint, jsonify, request
from config.database import get_db_connection
from datetime import datetime
import os

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    """Create new order from cart"""
    data = request.json
    
    # Get user_id
    user_id = data.get('user_id')
    
    if not user_id:
        print("❌ Error: User ID missing")
        return jsonify({'error': 'User ID required. Please login first.'}), 400
    
    # Convert to string to match cart table
    user_id = str(user_id)
    
    # Get shipping address (optional)
    shipping_address = data.get('shipping_address', '')
    
    print(f"\n📦 Creating order for user: {user_id}")
    print(f"   Shipping address: {shipping_address}")
    
    conn = get_db_connection()
    if not conn:
        print("❌ Error: Database connection failed")
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Get cart items
        print(f"🔍 Fetching cart items for user {user_id}...")
        cursor.execute("""
            SELECT c.product_id, c.quantity, p.price, p.stock, p.name
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s AND p.is_active = true
        """, (user_id,))
        
        cart_items = cursor.fetchall()
        
        if not cart_items:
            print("❌ Error: Cart is empty")
            return jsonify({'error': 'Cart is empty'}), 400
        
        print(f"✅ Found {len(cart_items)} items in cart")
        
        # Calculate total
        total_amount = sum(float(item['price']) * item['quantity'] for item in cart_items)
        print(f"💰 Order total: ${total_amount:.2f}")
        
        # Check stock availability
        print("🔍 Checking stock availability...")
        for item in cart_items:
            if item['quantity'] > item['stock']:
                print(f"❌ Insufficient stock for {item['name']}: requested {item['quantity']}, available {item['stock']}")
                return jsonify({'error': f'Insufficient stock for {item["name"]}. Only {item["stock"]} available.'}), 400
        
        print("✅ All items have sufficient stock")
        
        # Create order
        print("📝 Creating order record...")
        cursor.execute("""
            INSERT INTO orders (user_id, total_amount, shipping_address, status, created_at)
            VALUES (%s, %s, %s, 'pending', NOW())
            RETURNING id
        """, (user_id, total_amount, shipping_address))
        
        order_result = cursor.fetchone()
        order_id = order_result['id']
        print(f"✅ Order created with ID: {order_id}")
        
        # Create order items and update stock
        print("📝 Creating order items...")
        for item in cart_items:
            # Insert order item
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (order_id, item['product_id'], item['quantity'], item['price']))
            
            # Update product stock
            cursor.execute("""
                UPDATE products SET stock = stock - %s WHERE id = %s
            """, (item['quantity'], item['product_id']))
            
            print(f"   ✅ Added {item['name']} (qty: {item['quantity']}) to order")
        
        # Clear cart
        print("🗑️  Clearing cart...")
        cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
        
        conn.commit()
        print(f"✅ Order {order_id} completed successfully!")
        
        return jsonify({
            'message': 'Order placed successfully',
            'order_id': order_id,
            'total': float(total_amount)
        }), 200
        
    except Exception as e:
        print(f"❌ Error creating order: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return jsonify({'error': f'Failed to create order: {str(e)}'}), 500
        
    finally:
        cursor.close()
        conn.close()


@orders_bp.route('/orders', methods=['GET'])
def get_orders():
    """Get user's orders"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    # Convert to string
    user_id = str(user_id)
    
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
        
        # Add image URLs
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