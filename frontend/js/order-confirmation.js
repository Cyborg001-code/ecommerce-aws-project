// Order Confirmation Page Logic

async function loadOrderConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');
  
  if (!orderId) {
    showToast('No order found', 'error');
    window.location.href = 'index.html';
    return;
  }
  
  try {
    showLoading('order-details');
    const order = await API.getOrder(orderId);
    displayOrderConfirmation(order);
  } catch (error) {
    console.error('Error loading order:', error);
    document.getElementById('order-details').innerHTML = 
      '<p class="error">Failed to load order details</p>';
  }
}

function displayOrderConfirmation(order) {
  const container = document.getElementById('order-details');
  
  // Parse shipping address
  let addressLines = [];
  if (order.shipping_address) {
    addressLines = order.shipping_address.split('\n').filter(line => line.trim());
  }
  
  const name = addressLines[0] || 'N/A';
  const email = addressLines[1] || '';
  const phone = addressLines[2] || '';
  const fullAddress = addressLines.slice(3).join('<br>') || 'N/A';
  
  const statusColors = {
    'pending': '#f59e0b',
    'processing': '#3b82f6',
    'shipped': '#8b5cf6',
    'delivered': '#10b981',
    'cancelled': '#ef4444'
  };
  
  const statusColor = statusColors[order.status] || '#6b7280';
  
  container.innerHTML = `
    <div class="order-info" style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
        </div>
        <span class="status-badge" style="background: ${statusColor}; color: white; padding: 6px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; text-transform: uppercase;">
          ${order.status}
        </span>
      </div>
      <p style="font-size: 1.3rem; font-weight: bold; color: #007bff; margin-top: 15px;">
        <strong>Total:</strong> ${formatPrice(order.total_amount)}
      </p>
    </div>
    
    <div class="shipping-info" style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
      <h3>Shipping Address</h3>
      <div style="margin-top: 15px; line-height: 1.8;">
        <strong>${name}</strong><br>
        ${email ? email + '<br>' : ''}
        ${phone ? phone + '<br>' : ''}
        ${fullAddress}
      </div>
    </div>
    
    <div class="order-items-list">
      <h3>Items</h3>
      ${order.items && order.items.length > 0 ? 
        order.items.map(item => `
          <div class="order-item" style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; margin-bottom: 10px;">
            <img src="${item.imageUrl}" alt="${item.name}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
                 onerror="this.src='https://via.placeholder.com/60?text=${encodeURIComponent(item.name)}'">
            <div class="item-info" style="flex: 1;">
              <h4 style="margin: 0 0 5px 0; font-size: 1rem;">${item.name}</h4>
              <p style="margin: 0; color: #666; font-size: 0.9rem;">Quantity: ${item.quantity}</p>
            </div>
            <p class="item-price" style="font-weight: bold; color: #007bff;">${formatPrice(item.price * item.quantity)}</p>
          </div>
        `).join('') 
        : '<p>No items found</p>'
      }
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadOrderConfirmation);