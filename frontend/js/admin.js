// frontend/js/admin.js
// Admin panel functionality

// Check admin access on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdmin()) return;
  
  loadAdminProducts();
  setupImagePreview();
  setupAddProductForm();
});

// Image preview when selected
function setupImagePreview() {
  const imageInput = document.getElementById('product-image');
  if (imageInput) {
    imageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          showToast('Please select a valid image (JPG, PNG, GIF, WEBP)', 'error');
          this.value = '';
          return;
        }
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('Image size must be less than 5MB', 'error');
          this.value = '';
          return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('image-preview').innerHTML = 
            `<img src="${e.target.result}" alt="Preview" style="max-width: 300px; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Setup add product form submission
function setupAddProductForm() {
  const form = document.getElementById('add-product-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      // Validate form
      const name = document.getElementById('product-name').value.trim();
      const description = document.getElementById('product-description').value.trim();
      const price = parseFloat(document.getElementById('product-price').value);
      const stock = parseInt(document.getElementById('product-stock').value);
      const category = document.getElementById('product-category').value;
      const imageFile = document.getElementById('product-image').files[0];
      
      if (!name || !description || !category) {
        showToast('Please fill all required fields', 'error');
        return;
      }
      
      if (!imageFile) {
        showToast('Please select an image', 'error');
        return;
      }
      
      if (price <= 0) {
        showToast('Price must be greater than 0', 'error');
        return;
      }
      
      if (stock < 0) {
        showToast('Stock cannot be negative', 'error');
        return;
      }
      
      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading Image...';
      
      // 1. Upload image to S3
      const timestamp = Date.now();
      const imageKey = `products/${timestamp}-${imageFile.name.replace(/\s/g, '-')}`;
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('image_key', imageKey);
      
      const uploadResult = await API.uploadImage(formData);
      console.log('Image uploaded:', uploadResult);
      
      // 2. Create product
      submitBtn.textContent = 'Creating Product...';
      
      const productData = {
        name: name,
        description: description,
        price: price,
        stock: stock,
        category: category,
        image_key: imageKey
      };
      
      const result = await API.createProduct(productData);
      console.log('Product created:', result);
      
      showToast('Product added successfully!', 'success');
      
      // Reset form
      form.reset();
      document.getElementById('image-preview').innerHTML = '';
      
      // Reload products list
      loadAdminProducts();
      
    } catch (error) {
      console.error('Error adding product:', error);
      showToast(error.message || 'Failed to add product', 'error');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Load products for admin management
async function loadAdminProducts(filters = {}) {
  try {
    showLoading('products-list');
    
    const products = await API.getProducts(filters);
    
    displayAdminProducts(products);
    
  } catch (error) {
    console.error('Error loading products:', error);
    showError('products-list', 'Failed to load products');
  }
}

function displayAdminProducts(products) {
  const container = document.getElementById('products-list');
  
  if (!products || products.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px;">No products found</p>';
    return;
  }
  
  container.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'admin-product-card';
    
    card.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}"
           onerror="this.src='https://via.placeholder.com/100?text=${encodeURIComponent(product.name)}'">
      <div class="product-details">
        <h3>${product.name}</h3>
        <p>${truncate(product.description, 100)}</p>
        <p class="price">${formatPrice(product.price)}</p>
        <p><strong>Category:</strong> ${product.category}</p>
        <p><strong>Current Stock:</strong> ${product.stock}</p>
      </div>
      <div class="product-stock">
        <label>Update Stock:</label>
        <input type="number" value="${product.stock}" id="stock-${product.id}" min="0">
        <button class="btn-edit" onclick="updateStock(${product.id})">Update</button>
      </div>
      <div class="product-actions">
        <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

async function updateStock(productId) {
  const input = document.getElementById(`stock-${productId}`);
  const newStock = parseInt(input.value);
  
  if (newStock < 0) {
    showToast('Stock cannot be negative', 'error');
    return;
  }
  
  try {
    await API.updateProduct(productId, { stock: newStock });
    showToast('Stock updated successfully!', 'success');
    
  } catch (error) {
    console.error('Error updating stock:', error);
    showToast('Failed to update stock', 'error');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }
  
  try {
    await API.deleteProduct(productId);
    showToast('Product deleted successfully', 'success');
    
    // Reload products list
    loadAdminProducts();
    
  } catch (error) {
    console.error('Error deleting product:', error);
    showToast('Failed to delete product', 'error');
  }
}

// Filter products
function filterAdminProducts() {
  const search = document.getElementById('admin-search')?.value || '';
  const category = document.getElementById('admin-category-filter')?.value || '';
  
  const filters = {};
  if (search) filters.search = search;
  if (category) filters.category = category;
  
  loadAdminProducts(filters);
}