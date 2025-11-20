from flask import Blueprint, jsonify, request
from config.database import get_db_connection
import hashlib
import secrets

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    """Generate simple token (use JWT in production)"""
    return secrets.token_hex(32)


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Register new user"""
    
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({'error': 'All fields required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        hashed_password = hash_password(password)
        cursor.execute("""
            INSERT INTO users (name, email, password, created_at)
            VALUES (%s, %s, %s, NOW())
            RETURNING id
        """, (name, email, hashed_password))
        
        user_id = cursor.fetchone()['id']
        conn.commit()
        
        # Generate token
        token = generate_token()
        
        return jsonify({
            'message': 'Registration successful',
            'user': {'id': user_id, 'name': name, 'email': email},
            'token': token
        }), 200
        
    except Exception as e:
        print(f"Error registering user: {e}")
        conn.rollback()
        return jsonify({'error': 'Registration failed'}), 500
        
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Login user"""
    
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'error': 'Email and password required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Find user
        cursor.execute("""
            SELECT id, name, email, password 
            FROM users 
            WHERE email = %s
        """, (email,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password
        hashed_password = hash_password(password)
        if user['password'] != hashed_password:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate token
        token = generate_token()
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email']
            },
            'token': token
        }), 200
        
    except Exception as e:
        print(f"Error logging in: {e}")
        return jsonify({'error': 'Login failed'}), 500
        
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    """Logout user (frontend will clear localStorage)"""
    return jsonify({'message': 'Logged out successfully'}), 200