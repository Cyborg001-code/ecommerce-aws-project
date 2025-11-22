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
    const order = await API.getOrder(orderId);
    displayOrderConfirmation(order);
  } catch (error) {
    console.error('Error loading order:', error);
    document.getElementById('order-details').innerHTML = 
      '<div class="error"><p>Failed to load order details</p></div>';
  }
}

function displayOrderConfirmation(order) {
  const container = document.getElementById('order-details');
  
  container.innerHTML = `
    <div class="order-summary">
      <h3>Order #${order.id}</h3>
      <p><strong>Date:</strong> ${formatDateTime(order.created_at)}</p>
      <p><strong>Status:</strong> <span class="status-success">${order.status.toUpperCase()}</span></p>
      <p><strong>Total:</strong> ${formatPrice(order.total_amount)}</p>
      
      <div class="shipping-section">
        <h4>Shipping To:</h4>
        <p>${order.name}</p>
        <p>${order.address}</p>
        <p>${order.city}, ${order.postal_code}</p>
        <p>Phone: ${order.phone}</p>
      </div>
      
      <div class="items-section">
        <h4>Items Ordered:</h4>
        ${order.items.map(item => `
          <div class="confirmation-item">
            <span>${item.product_name} (x${item.quantity})</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadOrderConfirmation);