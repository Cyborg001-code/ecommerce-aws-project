// Cart Page Logic

async function loadCart() {
  if (!requireLogin()) return;
  
  try {
    const cart = await API.getCart();
    displayCart(cart);
  } catch (error) {
    console.error('Error loading cart:', error);
    document.getElementById('cart-container').innerHTML = 
      '<div class="error"><p>Failed to load cart</p></div>';
  }
}

function displayCart(cart) {
  const container = document.getElementById('cart-container');
  
  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
        <a href="products.html" class="btn-primary">Continue Shopping</a>
      </div>
    `;
    document.getElementById('cart-summary').style.display = 'none';
    return;
  }
  
  container.innerHTML = '';
  
  cart.items.forEach(item => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    
    cartItem.innerHTML = `
      <img src="${item.imageUrl}" 
           alt="${item.name}"
           onerror="this.src='https://via.placeholder.com/100?text=${encodeURIComponent(item.name)}'">
      <div class="item-details">
        <h3>${item.name}</h3>
        <p class="item-price">${formatPrice(item.price)}</p>
      </div>
      <div class="item-quantity">
        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
      </div>
      <div class="item-total">
        <p>${formatPrice(item.price * item.quantity)}</p>
      </div>
      <button class="btn-remove" onclick="removeItem(${item.id})">Remove</button>
    `;
    
    container.appendChild(cartItem);
  });
  
  document.getElementById('subtotal').textContent = formatPrice(cart.total);
  document.getElementById('total').textContent = formatPrice(cart.total + 10);
  document.getElementById('cart-summary').style.display = 'block';
}

async function updateQuantity(cartId, newQuantity) {
  if (newQuantity < 1) {
    removeItem(cartId);
    return;
  }
  
  try {
    await API.updateCartItem(cartId, newQuantity);
    loadCart();
    updateCartCount();
  } catch (error) {
    showToast('Failed to update quantity', 'error');
  }
}

async function removeItem(cartId) {
  if (!confirm('Remove this item from cart?')) return;
  
  try {
    await API.removeFromCart(cartId);
    showToast('Item removed', 'success');
    loadCart();
    updateCartCount();
  } catch (error) {
    showToast('Failed to remove item', 'error');
  }
}

function checkout() {
  window.location.href = 'checkout.html';
}

document.addEventListener('DOMContentLoaded', loadCart);