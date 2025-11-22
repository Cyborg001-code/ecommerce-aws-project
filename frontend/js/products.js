// Products Page Logic

let allProducts = [];

async function loadProducts(filters = {}) {
  try {
    document.getElementById('products-container').innerHTML = 
      '<div class="loading"><p>Loading products...</p></div>';
    
    allProducts = await API.getProducts(filters);
    displayProducts(allProducts);
    
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('products-container').innerHTML = 
      '<div class="error"><p>Failed to load products. Please try again.</p></div>';
  }
}

function displayProducts(products) {
  const container = document.getElementById('products-container');
  
  if (!products || products.length === 0) {
    container.innerHTML = '<div class="empty"><p>No products found</p></div>';
    return;
  }
  
  container.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
      <img src="${product.imageUrl}" 
           alt="${product.name}"
           onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}'">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="description">${product.description || ''}</p>
        <div class="product-footer">
          <span class="price">${formatPrice(product.price)}</span>
          <span class="stock">Stock: ${product.stock}</span>
        </div>
        ${product.stock > 0 ? 
          `<button class="btn-primary" onclick="addToCartFromList(${product.id})">Add to Cart</button>` :
          `<button class="btn-primary" disabled>Out of Stock</button>`
        }
      </div>
    `;
    
    container.appendChild(card);
  });
}

async function addToCartFromList(productId) {
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
  }
}

function applyFilters() {
  const search = document.getElementById('search-input')?.value || '';
  const category = document.getElementById('category-filter')?.value || '';
  
  const filters = {};
  if (search) filters.search = search;
  if (category) filters.category = category;
  
  loadProducts(filters);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });
  }
  
  loadProducts();
});