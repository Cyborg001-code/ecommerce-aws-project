from flask import Flask
from flask_cors import CORS
from config.database import test_connection
from routes.products import products_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(products_bp, url_prefix='/api')

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