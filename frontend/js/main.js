// frontend/js/main.js
// Common functionality across all pages

// Update cart count in header badge
async function updateCartCount() {
  try {
    // Check if user is logged in
    if (!isLoggedIn()) {
      const badge = document.getElementById('cart-badge');
      if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
      return;
    }
    
    // Get cart from API
    const cart = await API.getCart();
    
    // Calculate total items
    const totalItems = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    
    // Update badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
    
  } catch (error) {
    console.error('Failed to update cart count:', error);
    // Don't show error to user, just log it
  }
}

// Initialize on every page load
document.addEventListener('DOMContentLoaded', () => {
  // Update cart count on all pages
  updateCartCount();
});