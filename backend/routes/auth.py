from flask import Blueprint, jsonify, request
from config.database import get_db_connection
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# JWT Configuration
SECRET_KEY = os.getenv('JWT_SECRET_KEY')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password):
    """Secure password hashing with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id, email, name, is_admin=False):
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        'user_id': user_id,
        'email': email,
        'name': name,
        'is_admin': is_admin,
        'exp': expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Register new user"""
    
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    # Validation
    if not all([name, email, password]):
        return jsonify({'error': 'All fields required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user with bcrypt password
        hashed_password = hash_password(password)
        cursor.execute("""
            INSERT INTO users (name, email, password, is_admin, created_at)
            VALUES (%s, %s, %s, false, NOW())
            RETURNING id
        """, (name, email, hashed_password))
        
        user_id = cursor.fetchone()['id']
        conn.commit()
        
        # Generate JWT token
        token = create_access_token(user_id, email, name, is_admin=False)
        
        print(f"✅ User registered: {email} (ID: {user_id})")
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'is_admin': False
            },
            'token': token
        }), 200
        
    except Exception as e:
        print(f"❌ Error registering user: {e}")
        conn.rollback()
        return jsonify({'error': 'Registration failed'}), 500
        
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Login user"""
    
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not all([email, password]):
        return jsonify({'error': 'Email and password required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor()
    
    try:
        # Find user
        cursor.execute("""
            SELECT id, name, email, password, is_admin 
            FROM users 
            WHERE email = %s
        """, (email,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password with bcrypt
        if not verify_password(password, user['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        token = create_access_token(
            user['id'],
            user['email'],
            user['name'],
            user['is_admin']
        )
        
        print(f"✅ User logged in: {email}")
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'is_admin': user['is_admin']
            },
            'token': token
        }), 200
        
    except Exception as e:
        print(f"❌ Error logging in: {e}")
        return jsonify({'error': 'Login failed'}), 500
        
    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    """Logout user (frontend will clear token)"""
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/auth/verify', methods=['GET'])
def verify():
    """Verify JWT token"""
    
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({'error': 'No token provided'}), 401
    
    try:
        # Extract token from "Bearer <token>"
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
        payload = verify_token(token)
        
        return jsonify({
            'valid': True,
            'user': {
                'id': payload['user_id'],
                'email': payload['email'],
                'name': payload['name'],
                'is_admin': payload.get('is_admin', False)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'valid': False}), 401