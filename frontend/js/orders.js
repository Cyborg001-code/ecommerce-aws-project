// Orders Page Logic

async function loadOrders() {
  if (!requireLogin()) return;
  
  try {
    showLoading('orders-container');
    const orders = await API.getOrders();
    displayOrders(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    showError('orders-container', 'Failed to load orders');
  }
}

function displayOrders(orders) {
  const container = document.getElementById('orders-container');
  
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-orders">
        <h3>No orders yet</h3>
        <p>Start shopping to see your orders here!</p>
        <a href="products.html" class="btn-primary">Browse Products</a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  orders.forEach(order => {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    const statusColors = {
      'pending': '#f59e0b',
      'processing': '#3b82f6',
      'shipped': '#8b5cf6',
      'delivered': '#10b981',
      'cancelled': '#ef4444'
    };
    
    const statusColor = statusColors[order.status] || '#6b7280';
    
    // Parse shipping address - IMPROVED HANDLING
    let name = 'Customer';
    let email = '';
    let phone = '';
    let fullAddress = 'Address not provided';
    
    if (order.shipping_address && order.shipping_address.trim()) {
      const addressLines = order.shipping_address.split('\n').filter(line => line.trim());
      
      if (addressLines.length >= 4) {
        // New format: Name, Email, Phone, Address, City+Postal
        name = addressLines[0] || 'Customer';
        email = addressLines[1] || '';
        phone = addressLines[2] || '';
        fullAddress = addressLines.slice(3).join(', ') || 'Address not provided';
      } else if (addressLines.length > 0) {
        // Old format or partial data
        fullAddress = addressLines.join(', ');
      }
    }
    
    orderCard.innerHTML = `
      <div class="order-header">
        <div>
          <h3>Order #${order.id}</h3>
          <p class="order-date">${formatDate(order.created_at)}</p>
        </div>
        <div style="text-align: right;">
          <span class="status-badge" style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">
            ${order.status}
          </span>
          <p class="order-total" style="font-size: 1.5rem; font-weight: bold; color: #007bff; margin-top: 10px;">
            ${formatPrice(order.total_amount)}
          </p>
        </div>
      </div>
      
      <div class="order-body" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
        <div style="margin-bottom: 15px;">
          <strong>Shipping To:</strong><br>
          ${name}<br>
          ${email ? email + '<br>' : ''}
          ${phone ? 'Phone: ' + phone + '<br>' : ''}
          ${fullAddress}
        </div>
        
        <div id="order-items-${order.id}" style="margin-top: 20px;">
          <strong>Items:</strong><br>
          <div style="margin-top: 10px;">Loading items...</div>
        </div>
      </div>
      
      <div class="order-actions" style="margin-top: 20px; display: flex; gap: 10px;">
        <button onclick="viewOrderDetails(${order.id})" class="btn-view" style="padding: 10px 25px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
          View Details
        </button>
      </div>
    `;
    
    container.appendChild(orderCard);
    
    // Load items for this order
    loadOrderItems(order.id);
  });
}

async function viewOrderDetails(orderId) {
  window.location.href = `order-confirmation.html?order_id=${orderId}`;
}

async function loadOrderItems(orderId) {
  try {
    const order = await API.getOrder(orderId);
    const container = document.getElementById(`order-items-${orderId}`);
    
    if (!container) return;
    
    if (!order.items || order.items.length === 0) {
      container.innerHTML = '<div style="margin-top: 10px; color: #666;">No items found</div>';
      return;
    }
    
    container.innerHTML = `
      <strong>Items:</strong><br>
      <div style="margin-top: 10px;">
        ${order.items.map(item => `
          <div style="margin-bottom: 8px;">
            • ${item.name} (Qty: ${item.quantity}) - ${formatPrice(item.price * item.quantity)}
          </div>
        `).join('')}
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading order items:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadOrders);