// API Functions

const API = {
  baseURL: CONFIG.API_BASE_URL,
  
  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  },
  
  // Get user ID
  getUserId() {
    const user = getCurrentUser();
    return user ? (user.id || 'test_user') : 'test_user';
  },
  
  // Make API request
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      ...options.headers
    };
    
    // Only add Content-Type for JSON requests
    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // Products
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/products?${params}`);
  },
  
  async getProduct(id) {
    return this.request(`/products/${id}`);
  },
  
  // Cart
  async getCart(userId = null) {
    userId = userId || this.getUserId();
    return this.request(`/cart?user_id=${userId}`);
  },
  
  async addToCart(productId, quantity = 1, userId = null) {
    userId = userId || this.getUserId();
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, product_id: productId, quantity })
    });
  },
  
  async updateCartItem(cartId, quantity) {
    return this.request(`/cart/${cartId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },
  
  async removeFromCart(cartId) {
    return this.request(`/cart/${cartId}`, { method: 'DELETE' });
  },
  
  // Orders
  async createOrder(orderData) {
    orderData.user_id = orderData.user_id || this.getUserId();
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  
  async getOrders(userId = null) {
    userId = userId || this.getUserId();
    return this.request(`/orders?user_id=${userId}`);
  },
  
  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`);
  },
  
  async cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/cancel`, { method: 'POST' });
  },
  
  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },
  
  // Admin - Image Upload
  async uploadImage(formData) {
    const token = this.getToken();
    
    try {
      const response = await fetch(`${this.baseURL}/admin/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData  // Don't set Content-Type, let browser set it
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
  
  // Admin - Product Management
  async createProduct(productData) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  async updateProduct(productId, updates) {
    return this.request(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  
  async deleteProduct(productId) {
    return this.request(`/admin/products/${productId}`, {
      method: 'DELETE'
    });
  }
};