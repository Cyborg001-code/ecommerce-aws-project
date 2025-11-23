// API Functions

const API = {
  baseURL: CONFIG.API_BASE_URL,
  
  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  },
  
  // Set authentication token
  setToken(token) {
    localStorage.setItem('token', token);
  },
  
  // Remove token (logout)
  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Get user ID
  getUserId() {
    const user = getCurrentUser();
    if (!user || !user.id) {
      return null;
    }
    return user.id;
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
  
  // Helper methods for HTTP verbs
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
  
  // === PRODUCTS ===
  
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.get(`/products?${params}`);
  },
  
  async getProduct(id) {
    return this.get(`/products/${id}`);
  },
  
  async getCategories() {
    return this.get('/categories');
  },
  
  // === CART ===
  
  async getCart(userId = null) {
    userId = userId || this.getUserId();
    if (!userId) {
      throw new Error('Please login first');
    }
    return this.get(`/cart?user_id=${userId}`);
  },
  
  async addToCart(productId, quantity = 1, userId = null) {
    userId = userId || this.getUserId();
    
    if (!userId) {
      throw new Error('Please login first');
    }
    
    return this.post('/cart', { 
      user_id: userId,
      product_id: productId, 
      quantity 
    });
  },
  
  async updateCartItem(cartId, quantity) {
    return this.put(`/cart/${cartId}`, { quantity });
  },
  
  async removeFromCart(cartId) {
    return this.delete(`/cart/${cartId}`);
  },
  
  // === ORDERS ===
  
  async createOrder(orderData) {
    orderData.user_id = orderData.user_id || this.getUserId();
    return this.post('/orders', orderData);
  },
  
  async getOrders(userId = null) {
    userId = userId || this.getUserId();
    return this.get(`/orders?user_id=${userId}`);
  },
  
  async getOrder(orderId) {
    return this.get(`/orders/${orderId}`);
  },
  
  async cancelOrder(orderId) {
    return this.post(`/orders/${orderId}/cancel`, {});
  },
  
  // === AUTH ===
  
  async login(email, password) {
    return this.post('/auth/login', { email, password });
  },
  
  async register(name, email, password) {
    return this.post('/auth/register', { name, email, password });
  },
  
  async logout() {
    this.clearToken();
    return { message: 'Logged out successfully' };
  },
  
  // === ADMIN ===
  
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
    return this.post('/admin/products', productData);
  },
  
  async updateProduct(productId, updates) {
    return this.put(`/admin/products/${productId}`, updates);
  },
  
  async deleteProduct(productId) {
    return this.delete(`/admin/products/${productId}`);
  }
};