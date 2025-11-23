// Utility Functions

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

// Format date
function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format date with time
function formatDateTime(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Show toast notification
function showToast(message, type = 'success') {
  // Remove existing toasts
  const existing = document.querySelectorAll('.toast');
  existing.forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;
  
  // Add styles inline (in case CSS is missing)
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    font-weight: 600;
    display: flex;
    gap: 10px;
    align-items: center;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Truncate text
function truncate(text, length) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Show loading spinner
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px;">
      <div style="border: 4px solid #f3f4f6; border-top: 4px solid #6366f1; border-radius: 50%; width: 50px; height: 50px; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 20px; color: #6b7280; font-size: 1.1rem; font-weight: 600;">Loading...</p>
    </div>
  `;
  
  // Add animation if not exists
  if (!document.getElementById('loading-animation')) {
    const style = document.createElement('style');
    style.id = 'loading-animation';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Show error message
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;">⚠️</div>
      <h3 style="color: #1f2937; margin-bottom: 10px;">Oops! Something went wrong</h3>
      <p style="color: #6b7280; font-size: 1rem;">${message}</p>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Retry
      </button>
    </div>
  `;
}

// Get URL parameter
function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}