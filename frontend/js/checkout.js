// Checkout Page Logic

let cartData = null;

async function loadCheckout() {
  if (!requireLogin()) return;
  
  try {
    cartData = await API.getCart();
    
    if (!cartData.items || cartData.items.length === 0) {
      showToast('Your cart is empty', 'warning');
      window.location.href = 'cart.html';
      return;
    }
    
    displayOrderSummary(cartData);
    prefillForm();
    
  } catch (error) {
    console.error('Error loading checkout:', error);
    showToast('Failed to load checkout', 'error');
  }
}

function displayOrderSummary(cart) {
  const container = document.getElementById('order-items');
  
  container.innerHTML = '';
  
  cart.items.forEach(item => {
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    
    orderItem.innerHTML = `
      <div class="order-item-info">
        <strong>${item.name}</strong>
        <p>Qty: ${item.quantity}</p>
      </div>
      <div class="order-item-price">
        <p>${formatPrice(item.price * item.quantity)}</p>
      </div>
    `;
    
    container.appendChild(orderItem);
  });
  
  document.getElementById('subtotal').textContent = formatPrice(cart.total);
  document.getElementById('total').textContent = formatPrice(cart.total + 10);
}

function prefillForm() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCheckout();
  
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
      }
      
      // Get form values
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      const city = document.getElementById('city').value.trim();
      const postal = document.getElementById('postal').value.trim();
      
      // Build shipping address string
      const shippingAddress = `${name}\n${email}\n${phone}\n${address}\n${city}, ${postal}`;
      
      const orderData = {
        shipping_address: shippingAddress
      };
      
      try {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        const result = await API.createOrder(orderData);
        
        showToast('Order placed successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = `order-confirmation.html?order_id=${result.order_id}`;
        }, 1000);
        
      } catch (error) {
        console.error('Order error:', error);
        showToast(error.message || 'Failed to place order', 'error');
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
      }
    });
  }
});