// Orders Page Logic

async function loadOrders() {
  if (!requireLogin()) return;
  
  try {
    const orders = await API.getOrders();
    displayOrders(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    document.getElementById('orders-container').innerHTML = 
      '<div class="error"><p>Failed to load orders</p></div>';
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
    
    const canCancel = ['pending', 'processing'].includes(order.status);
    
    orderCard.innerHTML = `
      <div class="order-header">
        <div>
          <h3>Order #${order.id}</h3>
          <p class="order-date">${formatDate(order.created_at)}</p>
        </div>
        <div class="order-status-section">
          <span class="order-status" style="background: ${statusColors[order.status]};">
            ${order.status.toUpperCase()}
          </span>
          <p class="order-total">${formatPrice(order.total_amount)}</p>
        </div>
      </div>
      
      <div class="order-details">
        <p><strong>Shipping Address:</strong></p>
        <p>${order.address}, ${order.city} ${order.postal_code}</p>
        <p><strong>Contact:</strong> ${order.phone}</p>
      </div>
      
      <div class="order-items">
        <h4>Items:</h4>
        ${order.items ? order.items.map(item => `
          <div class="order-item-row">
            <span>${item.product_name} (x${item.quantity})</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
          </div>
        `).join('') : '<p>Loading items...</p>'}
      </div>
      
      <div class="order-actions">
        <button onclick="viewOrderDetails(${order.id})" class="btn-view">View Details</button>
        ${canCancel ? 
          `<button onclick="cancelOrder(${order.id})" class="btn-cancel">Cancel Order</button>` : 
          ''}
      </div>
    `;
    
    container.appendChild(orderCard);
  });
}

async function viewOrderDetails(orderId) {
  try {
    const order = await API.getOrder(orderId);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Order #${order.id} Details</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="order-info-section">
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${formatDateTime(order.created_at)}</p>
            <p><strong>Total:</strong> ${formatPrice(order.total_amount)}</p>
          </div>
          
          <div class="order-info-section">
            <h3>Shipping Information</h3>
            <p>${order.name}</p>
            <p>${order.email}</p>
            <p>${order.phone}</p>
            <p>${order.address}</p>
            <p>${order.city}, ${order.postal_code}</p>
          </div>
          
          <div class="order-info-section">
            <h3>Items</h3>
            ${order.items.map(item => `
              <div class="modal-order-item">
                <div>
                  <p><strong>${item.product_name}</strong></p>
                  <p>Quantity: ${item.quantity}</p>
                </div>
                <p>${formatPrice(item.price * item.quantity)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
  } catch (error) {
    showToast('Failed to load order details', 'error');
  }
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
    return;
  }
  
  try {
    await API.cancelOrder(orderId);
    showToast('Order cancelled successfully', 'success');
    loadOrders();
  } catch (error) {
    showToast(error.message || 'Failed to cancel order', 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadOrders);