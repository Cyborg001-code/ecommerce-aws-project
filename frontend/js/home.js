// frontend/js/home.js
// Load featured products on homepage

async function loadFeaturedProducts() {
  try {
    showLoading('featured-products-container');
    
    const products = await API.getProducts({ limit: 8 });
    
    const container = document.getElementById('featured-products-container');
    container.innerHTML = '';
    
    if (!products || products.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 40px;">No products available</p>';
      return;
    }
    
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" 
             onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}'">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="description">${truncate(product.description || '', 100)}</p>
          <div class="product-footer">
            <span class="price">${formatPrice(product.price)}</span>
            <span class="stock">Stock: ${product.stock}</span>
          </div>
          ${product.stock > 0 ? 
            `<button class="btn-primary" onclick="addToCartFromHome(${product.id})">Add to Cart</button>` :
            `<button class="btn-primary" disabled>Out of Stock</button>`
          }
        </div>
      `;
      
      // Click to view product details
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
          window.location.href = `products.html`;
        }
      });
      
      container.appendChild(card);
    });
    
  } catch (error) {
    console.error('Error loading featured products:', error);
    showError('featured-products-container', 'Failed to load products. Please refresh the page.');
  }
}

async function addToCartFromHome(productId) {
  if (!isLoggedIn()) {
    showToast('Please login first', 'warning');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    await API.addToCart(productId, 1);
    showToast('Product added to cart!', 'success');
    updateCartCount();
  } catch (error) {
    showToast('Failed to add to cart', 'error');
    console.error(error);
  }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  updateCartCount();
});