from flask import Flask
from flask_cors import CORS
from config.database import test_connection
from routes.products import products_bp
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.admin import admin_bp
from routes.auth import auth_bp

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://ecommerce-frontend-ankush-2025.s3-website-us-east-1.amazonaws.com'
], supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])

# Register blueprints
app.register_blueprint(products_bp, url_prefix='/api')
app.register_blueprint(cart_bp, url_prefix='/api')
app.register_blueprint(orders_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')

@app.route('/api/test', methods=['GET'])
def test():
    return {'message': 'Backend is working!'}

@app.route('/api/test-db', methods=['GET'])
def test_db():
    if test_connection():
        return {'message': 'Database connected successfully!'}
    else:
        return {'error': 'Database connection failed!'}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)