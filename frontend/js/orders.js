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
    
    // Parse shipping address
    let addressLines = [];
    if (order.shipping_address) {
      addressLines = order.shipping_address.split('\n').filter(line => line.trim());
    }
    
    const name = addressLines[0] || 'N/A';
    const email = addressLines[1] || '';
    const phone = addressLines[2] || '';
    const fullAddress = addressLines.slice(3).join(', ') || 'N/A';
    
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
          <strong>Shipping Address:</strong><br>
          ${name}<br>
          ${email ? email + '<br>' : ''}
          ${phone ? phone + '<br>' : ''}
          ${fullAddress}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Contact:</strong> ${phone || 'N/A'}
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

async function loadOrderItems(orderId) {
  try {
    const order = await API.getOrder(orderId);
    const itemsContainer = document.getElementById(`order-items-${orderId}`);
    
    if (!itemsContainer) return;
    
    if (order.items && order.items.length > 0) {
      itemsContainer.innerHTML = `
        <strong>Items:</strong><br>
        <div style="margin-top: 10px;">
          ${order.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
              <span>${item.name} x ${item.quantity}</span>
              <span style="font-weight: 600;">${formatPrice(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      itemsContainer.innerHTML = `
        <strong>Items:</strong><br>
        <div style="margin-top: 10px; color: #6b7280;">No items found</div>
      `;
    }
  } catch (error) {
    console.error(`Error loading items for order ${orderId}:`, error);
    const itemsContainer = document.getElementById(`order-items-${orderId}`);
    if (itemsContainer) {
      itemsContainer.innerHTML = `
        <strong>Items:</strong><br>
        <div style="margin-top: 10px; color: #ef4444;">Failed to load items</div>
      `;
    }
  }
}

async function viewOrderDetails(orderId) {
  window.location.href = `order-confirmation.html?order_id=${orderId}`;
}

document.addEventListener('DOMContentLoaded', loadOrders);